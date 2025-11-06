// routes/checkout.js
import express from "express";
import { CreateOrder } from "../models/CreateOrder.js";
import { GuestUser } from "../models/GuestUser.js";
import { Payment } from "../models/Payment.js";
import axios from "axios"; // fixed import

const router = express.Router();

// Create Order (COD or Razorpay)
router.post("/create", async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const {
      items,
      subtotal,
      shipping,
      total,
      shippingMethod,
      billingSame,
      shippingAddress,
      contactEmail,
      paymentMethod,
      discountCode,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    let userId = req.user?._id || null; // logged-in user
    let guestId = null;

    // 1️⃣ Create guest user if not logged in
    if (!userId) {
      const guest = await GuestUser.create({
        email: contactEmail,
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        address: shippingAddress.address,
        apartment: shippingAddress.apartment || "",
        city: shippingAddress.city,
        state: shippingAddress.state || "Delhi",
        zip: shippingAddress.zip || "110045",
        country: shippingAddress.country || "India",
        phone: shippingAddress.phone,
      });
      guestId = guest._id;
    }

    // 2️⃣ Prepare order items (support bundle)
    const orderItems = items.map((i) => ({
      productId: i.productId || null,
      bundleId: i.bundleId || null,
      title: i.title,
      variant: i.variant || "",
      quantity: i.quantity,
      price: i.price,
      total: i.total || i.quantity * i.price,
      bundleProducts: i.bundleProducts || [],
    }));

    // 3️⃣ Create order
    const order = await CreateOrder.create({
      userId,
      guestId,
      email: contactEmail,
      shippingMethod,
      billingSame,
      shippingAddress,
      saveInfo: false,
      items: orderItems,
      subtotal,
      shippingFee: shipping || 100,
      total,
      discountCode: discountCode || "",
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "initiated",
      orderStatus: "pending",
      statusHistory: [{ status: "pending" }],
    });

    // 4️⃣ Link order to guest
    if (!userId && guestId) {
      await GuestUser.findByIdAndUpdate(guestId, {
        $push: { orders: order._id },
      });
    }

    // 5️⃣ Razorpay flow
    if (paymentMethod === "razorpay") {
      const razorpayOptions = {
        amount: total * 100, // amount in paise
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

      const payment = await Payment.create({
        orderId: order._id,
        razorpayOrderId: razorpayOrder.data.id,
        amount: total,
        currency: "INR",
        status: "pending",
      });

      order.razorpayOrderId = razorpayOrder.data.id;
      await order.save();

      return res.json({
        success: true,
        orderId: order._id,
        amount: total,
        currency: "INR",
        razorpayOrderId: razorpayOrder.data.id,
      });
    }

    // 6️⃣ COD flow
    res.json({
      success: true,
      orderId: order._id,
      message: "Order placed successfully (COD)",
    });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Razorpay payment success webhook
router.post("/payment-success", async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = "success";
    await payment.save();

    const order = await CreateOrder.findById(payment.orderId);
    order.payment.status = "success";
    order.payment.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    res.json({ success: true, message: "Payment recorded successfully" });
  } catch (err) {
    console.error("Payment success error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
