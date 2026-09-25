// routes/checkout.js
import mongoose from "mongoose";
import express from "express";
import { Order } from "../models/Order.js";
import { GuestUser } from "../models/GuestUser.js";
import { Payment } from "../models/Payment.js";
import axios from "axios"; // fixed import
import { getNextOrderSeq } from "../models/Counter.js";
import { sendOrderEmail  } from "../utils/sendEmail.js";
import { requireAuth ,optionalAuth} from "../middleware/auth.js";
import {Product} from "../models/Product.js";
import { Bundle } from "../models/Bundle.js";
import {
  updateOrderInventory,
  updateOrderInventoryInSession
} from "../utils/inventoryUpdate.js";
import { Inventory } from "../models/Inventory.js";
import crypto from "crypto";
const router = express.Router();




router.post("/create", optionalAuth, async (req, res) => {
  try {
    console.log("Create order request body:", JSON.stringify(req.body.items));
    // return

    const userId = req.user?.id || req.user?._id || null;

    const {
      items,
      shippingMethod,
      billingSame,
      shippingAddress,
      contactEmail,
      paymentMethod,
      discountCode,
      source,
    } = req.body;

    // ✅ Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    // ✅ Validate payment method
    if (!["cod", "razorpay"].includes(paymentMethod)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }



    let calculatedSubtotal = 0;
    let originalSubtotal = 0;
    const validatedItems = [];
for (const item of items) {
  // =========================
  // 📦 NORMAL BUNDLE
  // =========================

  if (item.bundleId) {
    const bundle = await Bundle.findOne({
      publicId: item.bundleId
    });

    if (!bundle) {
      return res.status(400).json({
        error: "Invalid bundle",
      });
    }

    const bundleQuantity =
      Number(item.quantity) || 1;

const itemTotal =
  Number(bundle.price || 0) * bundleQuantity;

const bundleOldPrice =
  Number(bundle.oldPrice || bundle.price || 0) *
  bundleQuantity;

calculatedSubtotal += itemTotal;
originalSubtotal += bundleOldPrice;

    const bundleProductsValidated = [];

    for (const bp of item.bundleProducts || []) {
      const product = await Product.findOne({
        publicId: bp.productId,
      });

      if (!product) {
        return res.status(400).json({
          error: "Invalid bundle product",
        });
      }

      const variant = String(
        bp.variant || ""
      ).trim();

      const quantity =
        Number(bp.quantity) || 1;

      const requiredStock =
        quantity * bundleQuantity;

      if (!variant) {
        return res.status(400).json({
          error: `${product.title}: size is required`,
        });
      }

      const inventory =
        await Inventory.findOne({
          product: product._id,
          active: true,
        });

      if (!inventory) {
        return res.status(400).json({
          error: `Inventory not found for ${product.title}`,
        });
      }

      const availableStock =
        inventory.stock instanceof Map
          ? Number(
              inventory.stock.get(variant) || 0
            )
          : Number(
              inventory.stock?.[variant] || 0
            );

      if (
        inventory.trackInventory &&
        !inventory.allowBackorder &&
        availableStock < requiredStock
      ) {
     return res.status(409).json({
  success: false,
  code: "OUT_OF_STOCK",
  error: `${product.title} (${variant}) has only ${availableStock} left`,
  productId: product.publicId,
  variant,
  availableStock,
});
      }

      bundleProductsValidated.push({
        productId: product._id,
        title: product.title,
        variant,
        quantity,
        price: product.price,
        mainImage:
          product.images?.[0] || "",
      });
    }

    validatedItems.push({
      bundleId: bundle._id,
      customBundle: false,
      title: bundle.title,
      quantity: bundleQuantity,
      price: bundle.price,
      total: itemTotal,
    mainImage:
  item.mainImage &&
  item.mainImage !== "default.jpg"
    ? item.mainImage
    : bundleProductsValidated[0]?.mainImage || "default.jpg",
      bundleProducts:
        bundleProductsValidated,
    });

    continue;
  }

  // =========================
  // 🎁 CUSTOM BUNDLE
  // =========================

  if (item.customBundle) {
    let originalBundlePrice = 0;

    const bundleQuantity =
      Number(item.quantity) || 1;

    const bundleProductsValidated = [];

    if (
      !Array.isArray(item.bundleProducts) ||
      item.bundleProducts.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Custom bundle must contain products",
      });
    }

    for (const bp of item.bundleProducts) {
      const product = await Product.findOne({
        publicId: bp.productId,
      });

      if (!product) {
        return res.status(400).json({
          success: false,
          error: "Invalid bundle product",
        });
      }

      const quantity =
        Number(bp.quantity) || 1;

      const variant = String(
        bp.variant || ""
      ).trim();

      if (!variant) {
        return res.status(400).json({
          success: false,
          error: `${product.title}: size is required`,
        });
      }

      const inventory =
        await Inventory.findOne({
          product: product._id,
          active: true,
        });

      if (!inventory) {
        return res.status(400).json({
          success: false,
          error: `Inventory not found for ${product.title}`,
        });
      }

      const requiredStock =
        quantity * bundleQuantity;

      const availableStock =
        inventory.stock instanceof Map
          ? Number(
              inventory.stock.get(variant) || 0
            )
          : Number(
              inventory.stock?.[variant] || 0
            );

      if (
        inventory.trackInventory &&
        !inventory.allowBackorder &&
        availableStock < requiredStock
      ) {
     return res.status(409).json({
  success: false,
  code: "OUT_OF_STOCK",
  error: `${product.title} (${variant}) has only ${availableStock} left`,
  productId: product.publicId,
  variant,
  availableStock,
});
      }

      originalBundlePrice +=
        Number(product.price || 0) *
        quantity;

      bundleProductsValidated.push({
        productId: product._id,
        title: product.title,
        variant,
        quantity,
        price: product.price,
        mainImage:
          product.images?.[0] || "",
      });
    }

    const discountPercentage = 10;

    const discountAmount =
      originalBundlePrice *
      (discountPercentage / 100);

    const customBundlePrice = Math.round(
      originalBundlePrice -
        discountAmount
    );

    const itemTotal =
      customBundlePrice *
      bundleQuantity;

      originalSubtotal +=
  originalBundlePrice * bundleQuantity;

    calculatedSubtotal += itemTotal;

    validatedItems.push({
      customBundle: true,

      title:
        item.title || "Custom Bundle",

      quantity: bundleQuantity,

      price: customBundlePrice,

      originalPrice:
        originalBundlePrice,

      discountPercentage,

      discountAmount:
        Math.round(discountAmount),

      total: itemTotal,

      mainImage:
        item.mainImage || "",

      bundleProducts:
        bundleProductsValidated,
    });

    continue;
  }

  // =========================
  // 🛍️ NORMAL PRODUCT
  // =========================

const product = await Product.findOne({
  publicId: item.productId,
});

  if (!product) {
    return res.status(400).json({
      error: "Invalid product",
    });
  }

  const variant = String(
    item.variant || ""
  ).trim();

  if (!variant) {
    return res.status(400).json({
      error: `${product.title}: size is required`,
    });
  }

  const quantity =
    Number(item.quantity) || 1;

  if (quantity <= 0) {
    return res.status(400).json({
      error: "Invalid quantity",
    });
  }

  const inventory =
    await Inventory.findOne({
      product: product._id,
      active: true,
    });

  if (!inventory) {
    return res.status(400).json({
      error: `Inventory not found for ${product.title}`,
    });
  }

  const availableStock =
    inventory.stock instanceof Map
      ? Number(
          inventory.stock.get(variant) || 0
        )
      : Number(
          inventory.stock?.[variant] || 0
        );

  if (
    inventory.trackInventory &&
    !inventory.allowBackorder &&
    availableStock < quantity
  ) {
 return res.status(409).json({
  success: false,
  code: "OUT_OF_STOCK",
  error: `${product.title} (${variant}) has only ${availableStock} left`,
  productId: product.publicId,
  variant,
  availableStock,
});
  }

const itemTotal =
  Number(product.price || 0) *
  quantity;

const productOldPrice =
  Number(product.oldPrice || product.price || 0) *
  quantity;

calculatedSubtotal += itemTotal;
originalSubtotal += productOldPrice;

  validatedItems.push({
    productId: product._id,
    title: product.title,
    quantity,
    price: product.price,
    total: itemTotal,
    variant,
    mainImage:
      product.images?.[0] ||
      "default.jpg",
  });
}
  const shippingFee = 0;

const discountAmount = Math.max(
  0,
  Math.round(originalSubtotal - calculatedSubtotal)
);

const taxAmount = 0;

const grandTotal =
  calculatedSubtotal +
  shippingFee +
  taxAmount;

    // =========================
    // 👤 Guest Handling (unchanged)
    // =========================

let guestId = null;

if (!userId) {
  const clientGuestId = req.headers["x-guest-id"];
  console.log("Guest checkout with guestId:", clientGuestId);

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
      firstName: shippingAddress.firstName,
      lastName: shippingAddress.lastName,
      address: shippingAddress.address,
      apartment: shippingAddress.apartment || "",
      city: shippingAddress.city,
      state: shippingAddress.state || "none",
      zip: shippingAddress.zip || "none",
      country: shippingAddress.country || "India",
      phone: shippingAddress.phone,
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
      billingSame,
      shippingAddress,
      items: validatedItems, // ✅ secure items
      subtotal: originalSubtotal,

      discountAmount,

      couponDiscount: 0,

      shippingFee,

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
        amount: grandTotal  * 100, // 🔥 IMPORTANT (paise)
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
    console.error("Error creating order:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});



router.post("/webhook", async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    // =========================
    // 🔐 VERIFY WEBHOOK SIGNATURE
    // =========================

    const rawBody = req.body.toString();

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.log("❌ Invalid webhook signature");
      return res.sendStatus(400);
    }

    const event = JSON.parse(rawBody);

    // =========================
    // 💰 PAYMENT SUCCESS
    // =========================

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      const session = await mongoose.startSession();

      try {
        let confirmedOrderId = null;

        await session.withTransaction(async () => {
          // =========================
          // 🔗 FIND PAYMENT
          // =========================

          const paymentDoc = await Payment.findOne({
            razorpayOrderId: payment.order_id,
          }).session(session);

          if (!paymentDoc) {
            console.log("⚠️ Payment document not found");
            return;
          }

          // =========================
          // 📦 FIND ORDER
          // =========================

          const order = await Order.findById(
            paymentDoc.orderId
          ).session(session);

          if (!order) {
            console.log("⚠️ Order not found");
            return;
          }

          // =========================
          // 🚫 ALREADY PROCESSED
          // =========================

          if (paymentDoc.status === "paid") {
            console.log("ℹ️ Payment already processed");
            confirmedOrderId = order._id;
            return;
          }

          // =========================
          // 💰 VERIFY AMOUNT
          // =========================

          if (
            Number(payment.amount) !==
            Math.round(Number(order.total) * 100)
          ) {
            throw new Error(
              "Amount mismatch in webhook"
            );
          }

          // =========================
          // 💱 VERIFY CURRENCY
          // =========================

          if (payment.currency !== "INR") {
            throw new Error(
              "Currency mismatch in webhook"
            );
          }

          // =========================
          // 🔗 VERIFY RAZORPAY ORDER
          // =========================

          if (
            payment.order_id !==
            paymentDoc.razorpayOrderId
          ) {
            throw new Error(
              "Razorpay order mismatch"
            );
          }

          // =========================
          // 📦 DECREASE INVENTORY FIRST
          // =========================
          //
          // IMPORTANT:
          // Inventory + payment + order are
          // handled in ONE MongoDB transaction.
          //
          // If inventory fails:
          // transaction rolls back.
          //
          // Payment will NOT be marked paid
          // in our database.
          //

          await updateOrderInventoryInSession(
            order,
            session,
            "decrease"
          );

          // =========================
          // 💳 MARK PAYMENT PAID
          // =========================

          const claimedPayment =
            await Payment.findOneAndUpdate(
              {
                _id: paymentDoc._id,
                status: { $ne: "paid" },
              },
              {
                $set: {
                  status: "paid",
                  razorpayPaymentId: payment.id,
                  razorpaySignature: signature,
                },
              },
              {
                new: true,
                session,
              }
            );

          if (!claimedPayment) {
            console.log(
              "ℹ️ Payment already processed by another webhook"
            );
            return;
          }

          // =========================
          // ✅ CONFIRM ORDER
          // =========================

          order.paymentStatus = "paid";
          order.orderStatus = "confirmed";

          await order.save({ session });

          confirmedOrderId = order._id;
        });

        // =========================
        // 📧 SEND EMAIL AFTER COMMIT
        // =========================

        if (confirmedOrderId) {
          const confirmedOrder =
            await Order.findById(confirmedOrderId);

          if (confirmedOrder) {
            await sendOrderEmail({
              status: "confirmed",
              order: confirmedOrder,
            });

            console.log(
              `✅ Webhook: Payment captured, inventory deducted and order confirmed: ${confirmedOrder.orderNumber}`
            );
          }
        }

      } catch (err) {
        console.error(
          "❌ Payment/inventory transaction failed:",
          err
        );

        /*
         * IMPORTANT:
         *
         * Do NOT mark payment as paid here.
         *
         * Transaction has rolled back:
         * - inventory rollback
         * - payment remains pending
         * - order remains pending
         *
         * Razorpay can retry the webhook.
         */

        return res.sendStatus(500);

      } finally {
        await session.endSession();
      }
    }

    // =========================
    // ❌ PAYMENT FAILED
    // =========================

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;

      const paymentDoc = await Payment.findOne({
        razorpayOrderId: payment.order_id,
      });

      if (
        paymentDoc &&
        paymentDoc.status !== "paid"
      ) {
        paymentDoc.status = "failed";
        await paymentDoc.save();
      }

      console.log(
        "❌ Webhook: Payment failed"
      );
    }

    // =========================
    // ✅ ALWAYS RETURN 200
    // =========================

    return res.sendStatus(200);

  } catch (err) {
    console.error(
      "❌ Webhook error:",
      err
    );

    return res.sendStatus(500);
  }
});

router.post("/payment-success", async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // =========================
    // 🔐 1. VERIFY SIGNATURE
    // =========================

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature",
      });
    }

    // =========================
    // 📦 2. FIND ORDER
    // =========================

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }



if (order.razorpayOrderId !== razorpay_order_id) {
  return res.status(400).json({
    success: false,
    error: "Razorpay order mismatch",
  });
}

    // =========================
    // 🔁 3. PREVENT DOUBLE PROCESS
    // =========================

    if (order.paymentStatus === "paid") {
      return res.json({ success: true, message: "Already processed" });
    }

    // =========================
    // 🔗 4. VERIFY ORDER ↔ PAYMENT LINK
    // =========================

    const paymentDoc = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!paymentDoc || paymentDoc.orderId.toString() !== orderId) {
      return res.status(400).json({
        success: false,
        error: "Order mismatch",
      });
    }


    
    // =========================
    // 💰 5. VERIFY WITH RAZORPAY API
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

if (paymentData.status !== "captured") {
  paymentDoc.status = "failed";
  await paymentDoc.save();

  return res.status(400).json({
    success: false,
    error: "Payment not captured",
  });
}
    if (
      paymentData.amount !== order.total * 100 ||
      paymentData.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        error: "Amount mismatch",
      });
    }

// =========================
// ✅ 6. VERIFICATION ONLY
// =========================
// Do NOT mark payment/order as paid here.
// Webhook is responsible for final processing.

return res.json({
  success: true,
  message: "Payment verified successfully. Awaiting webhook confirmation.",
});

  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});



router.get("/track", optionalAuth, async (req, res) => {
  try {
    console.log("Track order query:", req.query);

    const { email, orderNumber } = req.query;
    const userId = req.user?.id || null;
    const guestId = req.headers["x-guest-id"];

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
    console.error("Track order error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/track-email",optionalAuth, async (req, res) => {
  try {
    const { email, orderNumber } = req.body;

    if (!email || !orderNumber) {
      return res.status(400).json({
        success: false,
        message: "Email and order number are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOrderNumber = orderNumber.trim();

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

    console.log(
      `📧 Tracking email sent to ${order.email} for ${order.orderNumber}`
    );

    return res.json({
      success: true,
      message: "Tracking email sent successfully.",
    });

  } catch (err) {
    console.error("❌ Tracking email error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to send tracking email.",
    });
  }
});

router.get("/mine", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const guestId = req.headers["x-guest-id"];


    let orders = [];

    if (userId) {
      orders = await Order.find({ userId });
    } else if (guestId) {
      orders = await Order.find({ guestId });
    } else {
      return res.status(400).json({ error: "No identity" });
    }
console.log(orders.length)
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
    const guestId = req.headers["x-guest-id"];

    console.log("🔄 MERGING guestId:", guestId, "→ user:", userId);

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

    console.log("✅ Orders merged:", result.modifiedCount);

    res.json({ success: true, merged: result.modifiedCount });
  } catch (err) {
    console.error("❌ Merge failed:", err);
    res.status(500).json({ error: "Merge failed" });
  }
});
router.get("/:publicOrderId", optionalAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      publicOrderId: req.params.publicOrderId,
    });

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
    console.error("Get order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
});
router.put("/cancel", optionalAuth, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { orderId } = req.body;
    const guestId = req.headers["x-guest-id"];
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

      await updateOrderInventoryInSession(
        updatedOrder,
        session,
        "increase"
      );

      cancelledOrderId =
        updatedOrder._id;
    });

    // =========================
    // 📦 GET UPDATED ORDER
    // =========================

    const cancelledOrder =
      await Order.findById(
        cancelledOrderId
      );

    return res.json({
      success: true,
      message:
        "Order cancelled successfully",
      order: cancelledOrder,
    });

  } catch (err) {
    console.error(
      "❌ Cancel error:",
      err
    );

    return res.status(
      err.status || 500
    ).json({
      success: false,
      error:
        err.message ||
        "Cancel failed",
    });

  } finally {
    await session.endSession();
  }
});












export default router;
