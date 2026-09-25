// utils/inventoryupdates.js

import mongoose from "mongoose";
import { Inventory } from "../models/Inventory.js";
import { Product } from "../models/Product.js";
import { Bundle } from "../models/Bundle.js";

/**
 * =========================================================
 * SYNC ALL PREBUILT BUNDLES FOR A PRODUCT
 * =========================================================
 *
 * Bundle.isOutOfStock = true
 * when ANY product inside the bundle is out of stock.
 *
 * Custom bundles are ignored.
 *
 * Example:
 *
 * Product A -> false
 * Product B -> false
 * Product C -> true
 *
 * Bundle -> true
 *
 * If Product C becomes available again:
 *
 * Product A -> false
 * Product B -> false
 * Product C -> false
 *
 * Bundle -> false
 */
export const syncBundlesForProduct = async (
  productId,
  session = null
) => {
  if (!productId) {
    return;
  }

  let bundleQuery = Bundle.find({
    products: productId,
    isCustomBundle: false,
  }).select("_id products");

  if (session) {
    bundleQuery = bundleQuery.session(session);
  }

  const bundles = await bundleQuery;

  if (!bundles.length) {
    return;
  }

  for (const bundle of bundles) {
    const productIds = bundle.products || [];

    let productQuery = Product.find({
      _id: {
        $in: productIds,
      },
    })
      .select("_id isOutOfStock")
      .lean();

    if (session) {
      productQuery = productQuery.session(session);
    }

    const products = await productQuery;

    const bundleIsOutOfStock = products.some(
      (product) => product.isOutOfStock === true
    );

    let update = Bundle.updateOne(
      {
        _id: bundle._id,
      },
      {
        $set: {
          isOutOfStock: bundleIsOutOfStock,
        },
      }
    );

    if (session) {
      update = update.session(session);
    }

    await update;
  }
};


/**
 * =========================================================
 * SYNC PRODUCT STOCK STATUS
 * =========================================================
 *
 * Inventory is the source of truth.
 *
 * total stock > 0
 *      ↓
 * Product.isOutOfStock = false
 *
 * total stock <= 0
 *      ↓
 * Product.isOutOfStock = true
 *
 * Then:
 *
 * Product.isOutOfStock
 *      ↓
 * Bundle.isOutOfStock
 */
export const syncProductStockStatus = async (
  productId,
  session = null
) => {
  if (!productId) {
    return null;
  }

  let request = Inventory.findOne({
    product: productId,
    active: true,
  }).lean();

  if (session) {
    request = request.session(session);
  }

  const inventory = await request;

  /*
   * No active inventory.
   *
   * Do not modify the product here because
   * the inventory record itself does not exist.
   */
  if (!inventory) {
    return null;
  }

  const stock =
    inventory.stock instanceof Map
      ? Object.fromEntries(inventory.stock)
      : inventory.stock || {};

  const totalStock = Object.values(stock).reduce(
    (total, quantity) => {
      return (
        total +
        Math.max(
          0,
          Number(quantity) || 0
        )
      );
    },
    0
  );

  const isOutOfStock =
    inventory.trackInventory &&
    !inventory.allowBackorder &&
    totalStock <= 0;

  let update = Product.findByIdAndUpdate(
    productId,
    {
      $set: {
        isOutOfStock: Boolean(isOutOfStock),
      },
    },
    {
      new: true,
    }
  );

  if (session) {
    update = update.session(session);
  }

  const product = await update;

  if (!product) {
    return null;
  }

  /*
   * IMPORTANT
   *
   * Product status has now been synchronized.
   *
   * Synchronize every prebuilt bundle that
   * contains this product.
   */
  await syncBundlesForProduct(
    productId,
    session
  );

  return product;
};


/**
 * =========================================================
 * DECREASE INVENTORY
 * =========================================================
 *
 * Used when an order is actually confirmed/paid.
 *
 * Adding something to cart does NOT decrease stock.
 */
export const decreaseInventory = async (
  productId,
  size,
  quantity = 1,
  session = null
) => {
  const qty = Number(quantity) || 1;

  if (qty <= 0) {
    throw new Error(
      "Invalid inventory quantity"
    );
  }

  if (!size) {
    throw new Error(
      "Product size/variant is required"
    );
  }

  const query = {
    product: productId,
    active: true,
    trackInventory: true,
    [`stock.${size}`]: {
      $gte: qty,
    },
  };

  let request = Inventory.findOneAndUpdate(
    query,
    {
      $inc: {
        [`stock.${size}`]: -qty,
      },
    },
    {
      new: true,
    }
  );

  if (session) {
    request = request.session(session);
  }

  const inventory = await request;

  if (!inventory) {
    const error = new Error(
      `Insufficient stock for size ${size}`
    );

    error.code = "OUT_OF_STOCK";
    error.status = 409;

    throw error;
  }

  /*
   * Sync:
   *
   * Inventory
   *     ↓
   * Product
   *     ↓
   * Bundle
   */
  await syncProductStockStatus(
    productId,
    session
  );

  return inventory;
};


/**
 * =========================================================
 * INCREASE INVENTORY
 * =========================================================
 *
 * Used for:
 * - cancellation
 * - return
 * - refund
 * - inventory restoration
 */
export const increaseInventory = async (
  productId,
  size,
  quantity = 1,
  session = null
) => {
  const qty = Number(quantity) || 1;

  if (qty <= 0) {
    throw new Error(
      "Invalid inventory quantity"
    );
  }

  if (!size) {
    throw new Error(
      "Product size/variant is required"
    );
  }

  let request = Inventory.findOneAndUpdate(
    {
      product: productId,
      active: true,
    },
    {
      $inc: {
        [`stock.${size}`]: qty,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (session) {
    request = request.session(session);
  }

  const inventory = await request;

  if (!inventory) {
    throw new Error(
      "Inventory not found"
    );
  }

  /*
   * Sync:
   *
   * Inventory
   *     ↓
   * Product
   *     ↓
   * Bundle
   */
  await syncProductStockStatus(
    productId,
    session
  );

  return inventory;
};


/**
 * =========================================================
 * UPDATE ORDER INVENTORY
 * =========================================================
 *
 * Runs all inventory changes inside ONE transaction.
 *
 * If any product fails:
 *
 * Product 1 -> deducted
 * Product 2 -> insufficient
 *
 * MongoDB transaction rolls everything back.
 */
export const updateOrderInventory = async (
  order,
  mode = "decrease"
) => {
  const session =
    await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(
      async () => {
        result =
          await updateOrderInventoryInSession(
            order,
            session,
            mode
          );
      }
    );

    return result;
  } finally {
    await session.endSession();
  }
};


/**
 * =========================================================
 * UPDATE ORDER INVENTORY IN EXISTING SESSION
 * =========================================================
 *
 * Used when Order + Inventory are already
 * running inside the same transaction.
 */
export const updateOrderInventoryInSession = async (
  order,
  session,
  mode = "decrease"
) => {
  const updateInventory =
    mode === "increase"
      ? increaseInventory
      : decreaseInventory;

  for (const item of order.items) {

    /*
     * -----------------------------------------
     * NORMAL PRODUCT
     * -----------------------------------------
     */
    if (item.productId) {
      await updateInventory(
        item.productId,
        item.variant,
        Number(item.quantity || 1),
        session
      );
    }

    /*
     * -----------------------------------------
     * BUNDLE / CUSTOM BUNDLE
     * -----------------------------------------
     *
     * Inventory is stored against the
     * individual products inside the bundle.
     */
    if (
      item.bundleProducts?.length
    ) {
      for (
        const bp of item.bundleProducts
      ) {
        const quantity =
          Number(bp.quantity || 1) *
          Number(item.quantity || 1);

        await updateInventory(
          bp.productId,
          bp.variant,
          quantity,
          session
        );
      }
    }
  }

  return true;
};