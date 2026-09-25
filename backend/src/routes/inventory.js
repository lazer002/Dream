// routes/inventory.js

import express from "express";
import { Inventory } from "../models/Inventory.js";
import { Product } from "../models/Product.js";
import {
  requireAuth,
  requireAdmin,
} from "../middleware/auth.js";
import {
  syncProductStockStatus,
  syncBundlesForProduct,
} from "../utils/inventoryUpdate.js";
const router = express.Router();





/* =====================================================
   GET ALL INVENTORY
===================================================== */

router.get(
  "/",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const inventories =
        await Inventory.find()
          .populate(
            "product",
            "_id publicId title sku images category sizes isOutOfStock"
          )
          .sort({
            updatedAt: -1,
          });

      res.json({
        success: true,
        items: inventories,
      });
    } catch (error) {
      console.error(
        "GET INVENTORY ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);


/* =====================================================
   GET INVENTORY BY ID
===================================================== */

router.get(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const inventory =
        await Inventory.findById(
          req.params.id
        ).populate(
          "product",
          "_id publicId title sku images category sizes isOutOfStock"
        );

      if (!inventory) {
        return res.status(404).json({
          error:
            "Inventory not found",
        });
      }

      res.json(inventory);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  }
);


/* =====================================================
   GET INVENTORY BY PRODUCT
===================================================== */

router.get(
  "/product/:productId",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const inventory =
        await Inventory.findOne({
          product:
            req.params.productId,
        }).populate(
          "product",
          "_id publicId title sku images category sizes isOutOfStock"
        );

      if (!inventory) {
        return res.status(404).json({
          error:
            "Inventory not found",
        });
      }

      res.json(inventory);
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  }
);


/* =====================================================
   CREATE INVENTORY
===================================================== */

router.post(
  "/",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const existing =
        await Inventory.findOne({
          product:
            req.body.product,
        });

      if (existing) {
        return res.status(409).json({
          error:
            "Inventory already exists",
        });
      }

      const stock = {};

      for (const [
        size,
        quantity,
      ] of Object.entries(
        req.body.stock || {}
      )) {
        stock[size] = Math.max(
          0,
          Number(quantity) || 0
        );
      }

      const trackInventory =
        req.body.trackInventory ??
        true;

      const inventory =
        await Inventory.create({
          product:
            req.body.product,

          sku:
            req.body.sku,

          stock,

          reserved: Math.max(
            0,
            Number(
              req.body.reserved
            ) || 0
          ),

          lowStockThreshold:
            Math.max(
              0,
              Number(
                req.body
                  .lowStockThreshold ??
                  5
              )
            ),

          trackInventory,

          allowBackorder:
            req.body
              .allowBackorder ??
            false,

          active:
            req.body.active ??
            true,
        });

   const updatedProduct =
  await syncProductStockStatus(
    inventory.product
  );

      return res.status(201).json({
        success: true,
        inventory,
        product:
          updatedProduct,
      });
    } catch (error) {
      console.error(
        "CREATE INVENTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);


/* =====================================================
   UPDATE INVENTORY
===================================================== */

router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const inventory =
        await Inventory.findByIdAndUpdate(
          req.params.id,
          {
            $set: req.body,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!inventory) {
        return res.status(404).json({
          error:
            "Inventory not found",
        });
      }

      /*
        This updates:

        1. Inventory.stock
        2. Product.isOutOfStock
        3. Every prebuilt Bundle
           containing this product
      */

   const product =
  await syncProductStockStatus(
    inventory.product
  );

      res.json({
        success: true,
        inventory,
        product,
      });
    } catch (error) {
      console.error(
        "UPDATE INVENTORY ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);


/* =====================================================
   UPDATE INVENTORY BY PRODUCT
===================================================== */

router.put(
  "/product/:productId",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const inventory =
        await Inventory.findOneAndUpdate(
          {
            product:
              req.params.productId,
          },
          {
            $set: req.body,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!inventory) {
        return res.status(404).json({
          error:
            "Inventory not found",
        });
      }

 const product =
  await syncProductStockStatus(
    inventory.product
  );

      res.json({
        success: true,
        inventory,
        product,
      });
    } catch (error) {
      console.error(
        "UPDATE PRODUCT INVENTORY ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);


/* =====================================================
   DELETE INVENTORY
===================================================== */

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const inventory =
        await Inventory.findByIdAndDelete(
          req.params.id
        );

      if (!inventory) {
        return res.status(404).json({
          error:
            "Inventory not found",
        });
      }


      const product =
        await Product.findByIdAndUpdate(
          inventory.product,
          {
            $set: {
              isOutOfStock: true,
            },
          },
          {
            new: true,
          }
        ).select(
          "_id publicId title isOutOfStock"
        );

      /*
        Recalculate all prebuilt bundles
        containing this product.
      */

      await syncBundlesForProduct(
        inventory.product
      );

      res.json({
        success: true,
        product,
      });
    } catch (error) {
      console.error(
        "DELETE INVENTORY ERROR:",
        error
      );

      res.status(500).json({
        error: error.message,
      });
    }
  }
);


export default router;