// routes/checkout.js
import { guestId as validGuestId } from "../utils/validate.js";
import mongoose from "mongoose";
import express from "express";
import { Order } from "../models/Order.js";
import { GuestUser } from "../models/GuestUser.js";
import { Payment } from "../models/Payment.js";
import axios from "axios"; // fixed import
import { getNextOrderSeq } from "../models/Counter.js";
import { sendOrderEmail  } from "../utils/sendEmail.js";
import { requireAuth ,optionalAuth} from "../middleware/auth.js";
import { orderLimiter, emailActionLimiter, paymentCheckLimiter } from "../middleware/rateLimit.js";
import { email as validEmail, quantity as validQuantity, str } from "../utils/validate.js";
import {Product} from "../models/Product.js";
import { Bundle } from "../models/Bundle.js";
import {
  updateOrderInventory,
  updateOrderInventoryInSession
} from "../utils/inventoryUpdate.js";
import { Inventory } from "../models/Inventory.js";
import crypto from "crypto";
const router = express.Router();




// Checks one product line against the database: real size + enough stock.
// Returns { error: {status, body} } or { ok: true }.
async function checkStock(product, variant, requiredQty) {
  if (!variant) {
    return { error: { status: 400, body: { error: `${product.title}: size is required` } } };
  }

  const inventory = await Inventory.findOne({ product: product._id, active: true });

  if (!inventory) {
    return { error: { status: 400, body: { error: `Inventory not found for ${product.title}` } } };
  }

  const activeSizes = (product.sizes || []).filter((s) => s.active !== false).map((s) => s.name);
  const stockSizes =
    inventory.stock instanceof Map ? [...inventory.stock.keys()] : Object.keys(inventory.stock || {});
  const knownSizes = activeSizes.length ? activeSizes : stockSizes;

  if (!knownSizes.includes(variant)) {
    return { error: { status: 400, body: { error: `${product.title}: invalid size` } } };
  }

  const availableStock =
    inventory.stock instanceof Map
      ? Number(inventory.stock.get(variant) || 0)
      : Number(inventory.stock?.[variant] || 0);

  if (inventory.trackInventory && !inventory.allowBackorder && availableStock < requiredQty) {
    return {
      error: {
        status: 409,
        body: {
          success: false,
          code: "OUT_OF_STOCK",
          error: `${product.title} (${variant}) has only ${availableStock} left`,
          productId: product.publicId,
          variant,
          availableStock,
        },
      },
    };
  }

  return { ok: true };
}

const bad = (res, error, status = 400) => res.status(status).json({ success: false, error });

const CUSTOM_BUNDLE_MIN = 2;
const CUSTOM_BUNDLE_MAX = 6;
const CUSTOM_BUNDLE_DISCOUNT = 10; // percent
const MAX_ORDER_LINES = 50;

router.post("/create", orderLimiter, optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || null;

    const { items, billingSame, shippingAddress, paymentMethod } = req.body || {};
    const shippingMethod = str(req.body?.shippingMethod, 50) || "standard";
    const discountCode = str(req.body?.discountCode, 50) || "";
    const source = ["web", "mobile"].includes(req.body?.source) ? req.body.source : "web";
    const contactEmail = validEmail(req.body?.contactEmail);

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    if (items.length > MAX_ORDER_LINES) {
      return bad(res, "Too many items in one order");
    }

    if (!["cod", "razorpay"].includes(paymentMethod)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    // Address: required strings only (no objects / operators).
    const address = shippingAddress && typeof shippingAddress === "object" ? shippingAddress : null;
    const cleanAddress = address && {
      firstName: str(address.firstName, 100),
      lastName: str(address.lastName, 100) || "",
      address: str(address.address, 300),
      apartment: str(address.apartment, 200) || "",
      city: str(address.city, 100),
      state: str(address.state, 100) || "",
      zip: str(address.zip, 20) || "",
      country: str(address.country, 100) || "India",
      phone: str(address.phone, 20),
    };

    if (
      !cleanAddress ||
      !cleanAddress.firstName ||
      !cleanAddress.address ||
      !cleanAddress.city ||
      !cleanAddress.phone
    ) {
      return bad(res, "Valid shipping address is required");
    }

    if (!userId && !contactEmail) {
      return bad(res, "Valid email is required");
    }

    let calculatedSubtotal = 0;
    let originalSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item || typeof item !== "object") {
        return bad(res, "Invalid item");
      }

      // =========================
      // 📦 NORMAL BUNDLE: contents + price from the database
      // =========================

      if (item.bundleId) {
        const bundle = await Bundle.findOne({ publicId: String(item.bundleId) });

        if (!bundle) return bad(res, "Invalid bundle");

        const bundleQuantity = validQuantity(item.quantity ?? 1);

        if (!bundleQuantity) return bad(res, "Invalid quantity");

        const clientParts = Array.isArray(item.bundleProducts) ? item.bundleProducts : [];
        const bundleProductsValidated = [];

        for (const productId of bundle.products || []) {
          const product = await Product.findById(productId);

          if (!product) return bad(res, "Invalid bundle product");

          // The client only chooses the SIZE of each product in the bundle.
          const chosen = clientParts.find(
            (bp) =>
              bp &&
              (String(bp.productId) === String(product.publicId) ||
                String(bp.productId) === String(product._id)),
          );
          const variant = str(chosen?.variant, 20) || "";

          const check = await checkStock(product, variant, bundleQuantity);

          if (check.error) return res.status(check.error.status).json(check.error.body);

          bundleProductsValidated.push({
            productId: product._id,
            title: product.title,
            variant,
            quantity: 1,
            price: product.price,
            mainImage: product.images?.[0] || "",
          });
        }

        if (!bundleProductsValidated.length) return bad(res, "Invalid bundle");

        const itemTotal = Number(bundle.price || 0) * bundleQuantity;

        calculatedSubtotal += itemTotal;
        originalSubtotal += Number(bundle.oldPrice || bundle.price || 0) * bundleQuantity;

        validatedItems.push({
          bundleId: bundle._id,
          customBundle: false,
          title: bundle.title,
          quantity: bundleQuantity,
          price: bundle.price,
          total: itemTotal,
          mainImage:
            bundle.mainImages?.[0] || bundleProductsValidated[0]?.mainImage || "default.jpg",
          bundleProducts: bundleProductsValidated,
        });

        continue;
      }

      // =========================
      // 🎁 CUSTOM BUNDLE: price = sum of DB prices - 10%
      // =========================

      if (item.customBundle) {
        const bundleQuantity = validQuantity(item.quantity ?? 1);

        if (!bundleQuantity) return bad(res, "Invalid quantity");

        const parts = Array.isArray(item.bundleProducts) ? item.bundleProducts : [];

        if (parts.length < CUSTOM_BUNDLE_MIN || parts.length > CUSTOM_BUNDLE_MAX) {
          return bad(res, `Custom bundle must contain ${CUSTOM_BUNDLE_MIN}-${CUSTOM_BUNDLE_MAX} products`);
        }

        let originalBundlePrice = 0;
        const seenProducts = new Set();
        const bundleProductsValidated = [];

        for (const bp of parts) {
          const product = bp && (await Product.findOne({ publicId: String(bp.productId) }));

          if (!product) return bad(res, "Invalid bundle product");

          if (seenProducts.has(String(product._id))) {
            return bad(res, "Custom bundle products must be different");
          }

          seenProducts.add(String(product._id));

          const variant = str(bp.variant, 20) || "";
          const check = await checkStock(product, variant, bundleQuantity);

          if (check.error) return res.status(check.error.status).json(check.error.body);

          originalBundlePrice += Number(product.price || 0);

          bundleProductsValidated.push({
            productId: product._id,
            title: product.title,
            variant,
            quantity: 1,
            price: product.price,
            mainImage: product.images?.[0] || "",
          });
        }

        const discountAmount = originalBundlePrice * (CUSTOM_BUNDLE_DISCOUNT / 100);
        const customBundlePrice = Math.round(originalBundlePrice - discountAmount);
        const itemTotal = customBundlePrice * bundleQuantity;

        originalSubtotal += originalBundlePrice * bundleQuantity;
        calculatedSubtotal += itemTotal;

        validatedItems.push({
          customBundle: true,
          title: str(item.title, 100) || "Custom Bundle",
          quantity: bundleQuantity,
          price: customBundlePrice,
          originalPrice: originalBundlePrice,
          discountPercentage: CUSTOM_BUNDLE_DISCOUNT,
          discountAmount: Math.round(discountAmount),
          total: itemTotal,
          mainImage: bundleProductsValidated[0]?.mainImage || "default.jpg",
          bundleProducts: bundleProductsValidated,
        });

        continue;
      }

      // =========================
      // 🛍️ NORMAL PRODUCT
      // =========================

      const product = await Product.findOne({ publicId: String(item.productId ?? "") });

      if (!product) return bad(res, "Invalid product");

      const quantity = validQuantity(item.quantity ?? 1);

      if (!quantity) return bad(res, "Invalid quantity");

      const variant = str(item.variant, 20) || "";
      const check = await checkStock(product, variant, quantity);

      if (check.error) return res.status(check.error.status).json(check.error.body);

      const itemTotal = Number(product.price || 0) * quantity;

      calculatedSubtotal += itemTotal;
      originalSubtotal += Number(product.oldPrice || product.price || 0) * quantity;

      validatedItems.push({
        productId: product._id,
        title: product.title,
        quantity,
        price: product.price,
        total: itemTotal,
        variant,
        mainImage: product.images?.[0] || "default.jpg",
      });
    }

  const shippingFee = 0;

const discountAmount = Math.max(
  0,
  Math.round(originalSubtotal - calculatedSubtotal)
);

const taxAmount = 0;

// COD handling fee (set COD_FEE in .env; the clients must show the server total).
const codFee = paymentMethod === "cod" ? Math.max(0, Number(process.env.COD_FEE || 0)) : 0;

const grandTotal = Math.round(
  calculatedSubtotal +
  shippingFee +
  codFee +
  taxAmount
);

if (!(grandTotal > 0)) {
  return bad(res, "Invalid order total");
}

    // =========================
    // 👤 Guest Handling (unchanged)
    // =========================

let guestId = null;

if (!userId) {
  const clientGuestId = validGuestId(req.headers["x-guest-id"]);

  // ✅ FIX: assign to outer variable
  guestId =
    clientGuestId && clientGuestId !== "null"
      ? clientGuestId
      : crypto.randomUUID();

  let guest = await GuestUser.findOne({ guestId });

  if (!guest) {
    guest = await GuestUser.create({
      guestId,
      email: contactEmail,
      firstName: cleanAddress.firstName,
      lastName: cleanAddress.lastName,
      address: cleanAddress.address,
      apartment: cleanAddress.apartment,
      city: cleanAddress.city,
      state: cleanAddress.state || "none",
      zip: cleanAddress.zip || "none",
      country: cleanAddress.country,
      phone: cleanAddress.phone,
    });
  }
}

    // =========================
    // 📦 Create Order
    // =========================

    const nextSeq = await getNextOrderSeq(new Date().getFullYear());
    const orderNumber = `DD-${new Date().getFullYear()}-${String(nextSeq).padStart(4, "0")}`;
    const initialOrderStatus = paymentMethod === "cod" ? "confirmed" : "pending";

    const order = await Order.create({
      userId: userId || null,
      guestId: userId ? null : guestId,
      email: userId ? (req.user.email || contactEmail) : contactEmail,
      orderNumber,
      shippingMethod,
      billingSame: billingSame !== false,
      shippingAddress: cleanAddress,
      items: validatedItems, // ✅ secure items
      subtotal: originalSubtotal,

      discountAmount,

      couponDiscount: 0,

      shippingFee: shippingFee + codFee,

      taxAmount,

      grandTotal,

      total: grandTotal,
      discountCode: discountCode || "",
      paymentMethod,
      source,
      paymentStatus: "pending",
      orderStatus: initialOrderStatus,
    });

if (paymentMethod === "cod") {
  try {
    await updateOrderInventory(order, "decrease");
  } catch (inventoryError) {
    console.error(
      "❌ COD inventory deduction failed:",
      inventoryError
    );

    // Remove the order because stock was not available
    await Order.findByIdAndDelete(order._id);

    return res.status(
      inventoryError.status || 409
    ).json({
      success: false,
      code:
        inventoryError.code || "OUT_OF_STOCK",
      error:
        inventoryError.message ||
        "Product is out of stock",
    });
  }
}



    // =========================
    // 👤 Guest order linking
    // =========================

    if (!userId) {
      await GuestUser.findOneAndUpdate(
        {guestId  },
        {
          $push: { orders: order._id },
        },
        { upsert: true }
      );
    }

    // =========================
    // 💳 Razorpay Integration
    // =========================

    if (paymentMethod === "razorpay") {
      const razorpayOptions = {
        amount: Math.round(grandTotal * 100), // paise, whole number
        currency: "INR",
        receipt: order._id.toString(),
      };

      const razorpayAuth = {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_SECRET,
        },
      };

      const razorpayOrder = await axios.post(
        "https://api.razorpay.com/v1/orders",
        razorpayOptions,
        razorpayAuth
      );

      await Payment.create({
        orderId: order._id,
        razorpayOrderId: razorpayOrder.data.id,
        amount: grandTotal,
        currency: "INR",
        status: "pending",
         method: "razorpay",
      });

      order.razorpayOrderId = razorpayOrder.data.id;
      await order.save();

   return res.json({
  success: true,
  orderNumber,
  publicOrderId: order.publicOrderId,
  orderId: order._id,
  amount: grandTotal,
  currency: "INR",
  razorpayOrderId: razorpayOrder.data.id,
});
    }

    // =========================
    // 📩 COD Email
    // =========================


await sendOrderEmail({
  status: "confirmed",
  order,
});

res.json({
  success: true,
  orderNumber,
  publicOrderId: order.publicOrderId,
  orderId: order._id,
  message: "Order placed successfully (COD)",
});

  } catch (err) {
    console.error("Error creating order:", err.message);
    res.status(500).json({ success: false, error: "Could not create order" });
  }
});



// Constant-time compare of two hex signatures (no timing leak).
const sameSignature = (expected, received) => {
  if (typeof received !== "string" || received.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
};

router.post("/webhook", async (req, res) => {

  try {
    const secret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    const signature =
      req.headers["x-razorpay-signature"];

    // =====================================================
    // 🔐 BASIC VALIDATION
    // =====================================================

    if (!secret) {
      console.error(
        "❌ RAZORPAY_WEBHOOK_SECRET is missing"
      );

      return res.sendStatus(500);
    }

    if (!signature) {
      console.error(
        "❌ Razorpay webhook signature missing"
      );

      return res.sendStatus(400);
    }

    // =====================================================
    // 📦 RAW BODY
    // IMPORTANT:
    // express.raw() MUST be configured before express.json()
    // =====================================================

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : String(req.body);

    // =====================================================
    // 🔐 VERIFY WEBHOOK SIGNATURE
    // =====================================================

    const expectedSignature =
      crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

    if (!sameSignature(expectedSignature, signature)) {
      console.error(
        "❌ INVALID RAZORPAY WEBHOOK SIGNATURE"
      );

      return res.sendStatus(400);
    }

    console.log(
      "✅ Razorpay webhook signature verified"
    );

    // =====================================================
    // 📦 PARSE EVENT
    // =====================================================

    let event;

    try {
      event = JSON.parse(rawBody);
    } catch (parseError) {
      console.error(
        "❌ Invalid webhook JSON:",
        parseError
      );

      return res.sendStatus(400);
    }

    console.log(
      "🔔 Razorpay event:",
      event.event
    );

    // =====================================================
    // 💰 PAYMENT CAPTURED
    // =====================================================

    if (event.event === "payment.captured") {
      const payment =
        event?.payload?.payment?.entity;

      if (!payment) {
        console.error(
          "❌ payment.captured but payment entity missing"
        );

        return res.sendStatus(400);
      }

      console.log("=================================");
      console.log("💰 PAYMENT CAPTURED");
      console.log("Payment ID:", payment.id);
      console.log("Razorpay Order ID:", payment.order_id);
      console.log("Amount:", payment.amount);
      console.log("Currency:", payment.currency);
      console.log("=================================");

      const session =
        await mongoose.startSession();

      let confirmedOrderId = null;

      try {
        await session.withTransaction(async () => {
          // =================================================
          // 🔎 FIND PAYMENT
          // =================================================

          const paymentDoc =
            await Payment.findOne({
              razorpayOrderId: payment.order_id,
            }).session(session);

          if (!paymentDoc) {
            throw new Error(
              `Payment document not found for Razorpay order ${payment.order_id}`
            );
          }

          console.log(
            "✅ Payment document:",
            paymentDoc._id.toString()
          );

          // =================================================
          // 🔎 FIND ORDER
          // =================================================

          const order =
            await Order.findById(
              paymentDoc.orderId
            ).session(session);

          if (!order) {
            throw new Error(
              `Order not found for payment ${paymentDoc._id}`
            );
          }

          console.log(
            "✅ Order found:",
            order.orderNumber
          );

          // =================================================
          // 🔐 VERIFY RAZORPAY ORDER ID
          // =================================================

          if (
            payment.order_id !==
            paymentDoc.razorpayOrderId
          ) {
            throw new Error(
              "Razorpay order ID mismatch"
            );
          }

          if (
            order.razorpayOrderId !==
            payment.order_id
          ) {
            throw new Error(
              "Order Razorpay order ID mismatch"
            );
          }

          // =================================================
          // 💰 VERIFY AMOUNT
          // =================================================

          const expectedAmount =
            Math.round(
              Number(order.total) * 100
            );

          if (
            Number(payment.amount) !==
            expectedAmount
          ) {
            throw new Error(
              `Amount mismatch. Razorpay=${payment.amount}, Order=${expectedAmount}`
            );
          }

          // =================================================
          // 💱 VERIFY CURRENCY
          // =================================================

          const expectedCurrency =
            order.currency || "INR";

          if (
            payment.currency !==
            expectedCurrency
          ) {
            throw new Error(
              `Currency mismatch. Razorpay=${payment.currency}, Order=${expectedCurrency}`
            );
          }

          // =================================================
          // 🚫 IDEMPOTENCY
          // =================================================

          if (
            paymentDoc.status === "paid" &&
            order.paymentStatus === "paid" &&
            order.orderStatus === "confirmed"
          ) {
            console.log(
              "ℹ️ Payment already fully processed"
            );

            confirmedOrderId =
              order._id;

            return;
          }

          // =================================================
          // 🔒 CLAIM PAYMENT FIRST
          //
          // This prevents duplicate Razorpay webhooks
          // from decreasing inventory twice.
          // =================================================

          const claimedPayment =
            await Payment.findOneAndUpdate(
              {
                _id: paymentDoc._id,
                status: {
                  $ne: "paid",
                },
              },
              {
                $set: {
                  status: "paid",
                  razorpayPaymentId:
                    payment.id,
                  razorpaySignature:
                    signature,
                },
              },
              {
                new: true,
                session,
              }
            );

          if (!claimedPayment) {
            console.log(
              "ℹ️ Payment already claimed by another webhook"
            );

            return;
          }

          console.log(
            "✅ Payment successfully claimed"
          );

          // =================================================
          // 📦 DECREASE INVENTORY
          //
          // If this fails, the MongoDB transaction rolls
          // back INCLUDING the payment claim.
          // =================================================

          console.log(
            "📦 Updating inventory..."
          );

          await updateOrderInventoryInSession(
            order,
            session,
            "decrease"
          );

          console.log(
            "✅ Inventory updated"
          );

          // =================================================
          // ✅ CONFIRM ORDER
          // =================================================

          order.paymentStatus =
            "paid";

          order.orderStatus =
            "confirmed";

          if (
            Array.isArray(
              order.statusHistory
            )
          ) {
            const alreadyConfirmed =
              order.statusHistory.some(
                (item) =>
                  item.status ===
                  "confirmed"
              );

            if (!alreadyConfirmed) {
              order.statusHistory.push({
                status: "confirmed",
                updatedAt: new Date(),
              });
            }
          } else {
            order.statusHistory = [
              {
                status: "pending",
                updatedAt:
                  order.createdAt ||
                  new Date(),
              },
              {
                status: "confirmed",
                updatedAt: new Date(),
              },
            ];
          }

          await order.save({
            session,
          });

          confirmedOrderId =
            order._id;

          console.log(
            "================================="
          );

          console.log(
            "✅ ORDER CONFIRMED:",
            order.orderNumber
          );

          console.log(
            "Payment Status:",
            order.paymentStatus
          );

          console.log(
            "Order Status:",
            order.orderStatus
          );

          console.log(
            "================================="
          );
        });

        // =====================================================
        // ✅ TRANSACTION COMMITTED
        // =====================================================

        console.log(
          "✅ PAYMENT TRANSACTION COMMITTED"
        );

        // =====================================================
        // 📧 EMAIL AFTER DATABASE COMMIT
        // =====================================================

        if (confirmedOrderId) {
          const confirmedOrder =
            await Order.findById(
              confirmedOrderId
            );

          if (confirmedOrder) {
            try {
              await sendOrderEmail({
                status: "confirmed",
                order: confirmedOrder,
              });

              console.log(
                "📧 Confirmation email sent"
              );
            } catch (emailError) {
              console.error(
                "⚠️ Confirmation email failed:",
                emailError
              );
            }
          }
        }

      } catch (err) {
        console.error(
          "================================="
        );

        console.error(
          "❌ WEBHOOK TRANSACTION FAILED"
        );
        console.error(err?.message || err);

        // Paid, but the stock sold out meanwhile: retrying can never succeed.
        // Cancel the order and refund the customer, then stop Razorpay retries.
        if (err?.code === "OUT_OF_STOCK") {
          try {
            const paymentDoc = await Payment.findOne({ razorpayOrderId: payment.order_id });
            const failedOrder = paymentDoc && (await Order.findById(paymentDoc.orderId));

            if (failedOrder && failedOrder.orderStatus !== "cancelled") {
              await Payment.updateOne(
                { _id: paymentDoc._id },
                { $set: { status: "paid", razorpayPaymentId: payment.id } },
              );
              await Order.findOneAndUpdate(
                { _id: failedOrder._id },
                { $set: { orderStatus: "cancelled", paymentStatus: "paid" } },
              );
              await refundRazorpayOrder(failedOrder);
            }
          } catch (refundErr) {
            console.error(`[REFUND NEEDED] Razorpay order ${payment.order_id}:`, refundErr.message);
          }

          return res.sendStatus(200);
        }

        console.error(
          "================================="
        );

        /*
         * IMPORTANT
         *
         * Because everything is inside the MongoDB
         * transaction, failure rolls back:
         *
         * 1. Payment status
         * 2. Inventory
         * 3. Order confirmation
         *
         * Razorpay will retry the webhook.
         */

        return res.sendStatus(500);

      } finally {
        await session.endSession();
      }

      return res.sendStatus(200);
    }

    // =====================================================
    // ❌ PAYMENT FAILED
    // =====================================================

    if (
      event.event === "payment.failed"
    ) {
      const payment =
        event?.payload?.payment?.entity;

      if (!payment) {
        console.error(
          "❌ payment.failed but payment entity missing"
        );

        return res.sendStatus(400);
      }

      console.log(
        "❌ PAYMENT FAILED:",
        payment.id
      );

      const paymentDoc =
        await Payment.findOne({
          razorpayOrderId:
            payment.order_id,
        });

      if (
        paymentDoc &&
        paymentDoc.status !== "paid"
      ) {
        paymentDoc.status =
          "failed";

        paymentDoc.razorpayPaymentId =
          payment.id;

        await paymentDoc.save();

        console.log(
          "✅ Payment marked failed"
        );
      }

      return res.sendStatus(200);
    }

    // =====================================================
    // ℹ️ OTHER RAZORPAY EVENTS
    // =====================================================

    console.log(
      "ℹ️ Ignored Razorpay event:",
      event.event
    );

    return res.sendStatus(200);

  } catch (err) {
    console.error(
      "================================="
    );

    console.error(
      "❌ RAZORPAY WEBHOOK ERROR"
    );

    console.error(err);

    console.error(
      "================================="
    );

    return res.sendStatus(500);
  }
});

router.post("/payment-success", paymentCheckLimiter, async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // =========================
    // 1. VALIDATE REQUEST
    // =========================

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: "Missing payment verification fields",
      });
    }

    // =========================
    // 2. VERIFY RAZORPAY SIGNATURE
    // =========================

    const body =
      razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_SECRET
      )
      .update(body)
      .digest("hex");

    if (!sameSignature(expectedSignature, razorpay_signature)) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: "Invalid payment signature",
      });
    }

    // =========================
    // 3. FIND ORDER
    // =========================

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        verified: false,
        error: "Order not found",
      });
    }

    // =========================
    // 4. VERIFY RAZORPAY ORDER ID
    // =========================

    if (
      order.razorpayOrderId !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: "Razorpay order mismatch",
      });
    }

    // =========================
    // 5. FIND PAYMENT DOCUMENT
    // =========================

    const paymentDoc = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!paymentDoc) {
      return res.status(404).json({
        success: false,
        verified: false,
        error: "Payment record not found",
      });
    }

    // =========================
    // 6. VERIFY PAYMENT ↔ ORDER
    // =========================

    if (
      paymentDoc.orderId.toString() !==
      orderId.toString()
    ) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: "Payment and order mismatch",
      });
    }

    // =========================
    // 7. VERIFY PAYMENT WITH RAZORPAY
    // =========================

    const razorpayRes = await axios.get(
      `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_SECRET,
        },
      }
    );

    const paymentData = razorpayRes.data;

    // =========================
    // 8. VERIFY PAYMENT STATUS
    // =========================

    if (paymentData.status !== "captured") {
      return res.status(400).json({
        success: false,
        verified: false,
        error: "Payment not captured",
      });
    }

    // =========================
    // 9. VERIFY RAZORPAY ORDER
    // =========================

    if (
      paymentData.order_id !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: "Razorpay payment order mismatch",
      });
    }

    // =========================
    // 10. VERIFY AMOUNT
    // =========================

    const expectedAmount = Math.round(
      Number(order.total) * 100
    );

    if (
      Number(paymentData.amount) !==
      expectedAmount
    ) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: "Payment amount mismatch",
      });
    }

    // =========================
    // 11. VERIFY CURRENCY
    // =========================

    if (paymentData.currency !== "INR") {
      return res.status(400).json({
        success: false,
        verified: false,
        error: "Payment currency mismatch",
      });
    }

    // =========================
    // 12. VERIFICATION ONLY
    // =========================
    //
    // DO NOT:
    // - mark Payment as paid
    // - mark Order as paid
    // - confirm Order
    // - decrease inventory
    //
    // WEBHOOK DOES ALL OF THAT.
    // =========================

    return res.status(200).json({
      success: true,
      verified: true,
      confirmed: false,
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      message:
        "Payment verified successfully. Awaiting Razorpay webhook confirmation.",
    });

  } catch (err) {
    console.error(
      "Payment verification error:",
      err
    );

    return res.status(500).json({
      success: false,
      verified: false,
      error: "Payment verification failed",
    });
  }
});



router.get("/track", optionalAuth, async (req, res) => {
  try {
    const email = validEmail(req.query.email);
    const orderNumber = str(req.query.orderNumber, 50);
    const userId = req.user?.id || null;
    const guestId = validGuestId(req.headers["x-guest-id"]);

    // =========================
    // 🔍 BASIC VALIDATION
    // =========================

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: "Order number is required",
      });
    }

    let order;

    // =========================
    // 👤 LOGGED-IN USER
    // =========================

    if (userId) {
      order = await Order.findOne({
        orderNumber,
        userId,
      }).lean();
    }

    // =========================
    // 👤 GUEST USER
    // =========================

    else {
      if (!email || !guestId) {
        return res.status(400).json({
          success: false,
          message: "Email, order number and guest ID are required",
        });
      }

      order = await Order.findOne({
        orderNumber,
        email,
        guestId,
      }).lean();
    }

    // =========================
    // ❌ NOT FOUND
    // =========================

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // =========================
    // ✅ RESPONSE
    // =========================

    return res.json({
      success: true,
      order,
    });

  } catch (err) {
    console.error("Track order error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/track-email", emailActionLimiter, optionalAuth, async (req, res) => {
  try {
    const email = validEmail(req.body?.email);
    const orderNumber = str(req.body?.orderNumber, 50);

    if (!email || !orderNumber) {
      return res.status(400).json({
        success: false,
        message: "Email and order number are required.",
      });
    }

    const normalizedEmail = email;
    const normalizedOrderNumber = orderNumber;

    const order = await Order.findOne({
      email: normalizedEmail,
      orderNumber: normalizedOrderNumber,
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "No matching order found for this email and order number.",
      });
    }

    const origin = process.env.CLIENT_ORIGIN_WEB;

    if (!origin) {
      throw new Error("CLIENT_ORIGIN_WEB is not configured");
    }

    const trackLink =
      `${origin}/trackorder` +
      `?email=${encodeURIComponent(order.email)}` +
      `&orderNumber=${encodeURIComponent(order.orderNumber)}`;

    const result = await sendOrderEmail({
      status: "tracking",
      order,
      trackLink,
    });

    if (!result.success) {
      throw result.error;
    }

    

    return res.json({
      success: true,
      message: "Tracking email sent successfully.",
    });

  } catch (err) {
    console.error("Tracking email error:", err?.message || err);

    return res.status(500).json({
      success: false,
      message: "Failed to send tracking email.",
    });
  }
});

router.get("/mine", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const guestId = validGuestId(req.headers["x-guest-id"]);


    let orders = [];

    if (userId) {
      orders = await Order.find({ userId });
    } else if (guestId) {
      orders = await Order.find({ guestId });
    } else {
      return res.status(400).json({ error: "No identity" });
    }

    res.json({
      orders: orders.sort((a, b) => b.createdAt - a.createdAt),
    });
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});
router.post("/merge-orders", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const guestId = validGuestId(req.headers["x-guest-id"]);

    

    if (!guestId) {
      return res.json({ message: "No guest orders" });
    }

    const result = await Order.updateMany(
      { guestId }, // ✅ THIS IS KEY
      {
        $set: { userId },
        $unset: { guestId: "" },
      }
    );

    

    res.json({ success: true, merged: result.modifiedCount });
  } catch (err) {
    console.error("❌ Merge failed:", err);
    res.status(500).json({ error: "Merge failed" });
  }
});
router.get("/:publicOrderId", optionalAuth, async (req, res) => {
  try {
    // publicOrderId is a random UUID (works like a private link), but never
    // return internal ids / payment secrets with it.
    const order = await Order.findOne({
      publicOrderId: str(req.params.publicOrderId, 64) || "-",
    }).select("-guestId -userId -razorpaySignature -razorpayPaymentId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
});
// Stock is taken when a COD order is placed, or when an online payment is
// captured (webhook). Only give back what was actually taken.
const stockWasDeducted = (order) =>
  order.paymentMethod === "cod" || order.paymentStatus === "paid";

async function refundRazorpayOrder(order) {
  const payment = await Payment.findOne({ orderId: order._id, status: "paid" });
  const paymentId = payment?.razorpayPaymentId || order.razorpayPaymentId;

  if (!payment || !paymentId) return { refunded: false, reason: "no captured payment" };

  try {
    const refund = await axios.post(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`,
      { amount: Math.round(Number(payment.amount) * 100), notes: { orderNumber: order.orderNumber } },
      {
        auth: { username: process.env.RAZORPAY_KEY_ID, password: process.env.RAZORPAY_SECRET },
        timeout: 15000,
      },
    );

    await Payment.updateOne(
      { _id: payment._id },
      { $set: { status: "refunded", refundId: refund.data?.id, refundError: null } },
    );

    return { refunded: true };
  } catch (err) {
    const reason = err.response?.data?.error?.description || err.message;

    await Payment.updateOne({ _id: payment._id }, { $set: { refundError: reason } });
    // Needs manual action in the Razorpay dashboard.
    console.error(`[REFUND NEEDED] order ${order.orderNumber}:`, reason);

    return { refunded: false, reason };
  }
}

router.put("/cancel", optionalAuth, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const orderId = str(req.body?.orderId, 50);

    if (!orderId || !mongoose.isValidObjectId(orderId)) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    const guestId = validGuestId(req.headers["x-guest-id"]);
    const userId = req.user?.id || null;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // =========================
    // 🔒 SECURITY
    // =========================

    if (userId) {
      if (
        order.userId?.toString() !==
        userId.toString()
      ) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized",
        });
      }
    } else {
      if (
        !guestId ||
        order.guestId !== guestId
      ) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized",
        });
      }
    }

    // =========================
    // 🚫 VALIDATE STATUS
    // =========================

    if (
      !["pending", "confirmed"].includes(
        order.orderStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Order cannot be cancelled now",
      });
    }

    let cancelledOrderId = null;

    // =========================
    // 🔒 ATOMIC CANCEL + INVENTORY
    // =========================

    await session.withTransaction(async () => {
      const updatedOrder =
        await Order.findOneAndUpdate(
          {
            _id: orderId,
            orderStatus: {
              $in: [
                "pending",
                "confirmed",
              ],
            },
          },
          {
            $set: {
              orderStatus: "cancelled",
            },
          },
          {
            new: true,
            session,
          }
        );

      // Another request cancelled it first
      if (!updatedOrder) {
        const error = new Error(
          "Order was already cancelled or cannot be cancelled now"
        );

        error.status = 400;

        throw error;
      }

      // =========================
      // 📦 RESTORE INVENTORY
      // =========================

      if (stockWasDeducted(updatedOrder)) {
        await updateOrderInventoryInSession(
          updatedOrder,
          session,
          "increase"
        );
      }

      cancelledOrderId =
        updatedOrder._id;
    });

    // =========================
    // 📦 GET UPDATED ORDER
    // =========================

    const cancelledOrder = await Order.findById(cancelledOrderId);

    // Paid online: money goes back automatically.
    let refund = null;

    if (cancelledOrder.paymentMethod === "razorpay" && cancelledOrder.paymentStatus === "paid") {
      refund = await refundRazorpayOrder(cancelledOrder);
    }

    return res.json({
      success: true,
      message: refund
        ? refund.refunded
          ? "Order cancelled. Your refund has been started."
          : "Order cancelled. Your refund will be processed by our team."
        : "Order cancelled successfully",
      refundStarted: Boolean(refund?.refunded),
      order: cancelledOrder,
    });

  } catch (err) {
    console.error("Cancel error:", err.message);

    return res.status(err.status || 500).json({
      success: false,
      error: err.status ? err.message : "Cancel failed",
    });

  } finally {
    await session.endSession();
  }
});












export default router;
