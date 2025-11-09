// routes/adminOrders.js
import express from "express";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { sendEmail } from "../utils/sendEmail.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Helper: validate mongo id
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/admin/orders
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.orderStatus = req.query.status;
    if (req.query.source) filter.source = req.query.source;

    if (req.query.search) {
      const q = String(req.query.search).slice(0, 100); // limit length to avoid abuse
      filter.$or = [
        { orderNumber: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { "shippingAddress.phone": { $regex: q, $options: "i" } },
      ];
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(
        "orderNumber email orderStatus total createdAt paymentMethod paymentStatus source items.mainImage  " +
          "shippingAddress.firstName shippingAddress.lastName shippingAddress.phone"
      )
      .lean();

    const ordersWithCount = orders.map((o) => ({
      ...o,
      itemCount: Array.isArray(o.items) ? o.items.reduce((sum, i) => sum + (i.quantity || 1), 0) : 0,
    }));
console.log("Fetched orders:", JSON.stringify(ordersWithCount, null, 2));
    res.json({
      success: true,
      page,
      limit,
      total,
      orders: ordersWithCount,
    });

  } catch (err) {
    console.error("getOrders error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

// GET /api/admin/orders/:id
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid order id" });

    const order = await Order.findById(id).lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    console.error("getOrderById error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log("updateOrderStatus called with body:", req.body);
    const id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    if (!req.body || typeof req.body.status !== "string") {
      return res.status(400).json({ success: false, message: "Status is required" });
    }
    const status = req.body.status.trim().toLowerCase();

    const VALID_STATUSES = ["pending", "confirmed", "dispatched", "shipped", "out for delivery", "delivered", "cancelled", "refunded" ];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const current = await Order.findById(id).select("orderStatus").lean();
    if (!current) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (current.orderStatus === status) {
      return res.json({ success: true, message: "Status unchanged", order: current });
    }

    // prepare audit entry
    const actor = req.user?._id || null;
    const pushEntry = actor ? { status, updatedAt: new Date(), by: actor } : { status, updatedAt: new Date() };

    // update and push to front of array so newest is first
    const updated = await Order.findByIdAndUpdate(
      id,
      {
        $set: { orderStatus: status, updatedAt: new Date() },
        $push: { statusHistory: { $each: [pushEntry], $position: 0 } },
      },
      { new: true, runValidators: true }
    ).lean();

    if (req.body.sendEmail) {
      try {

        await sendStatusChangeEmail(updated.email, status, updated.orderNumber);
      } catch (emailErr) {
        console.error("Status updated but failed to send email:", emailErr);
        // don't fail the whole request — inform client that email failed
        return res.json({
          success: true,
          message: "Order status updated (email failed)",
          order: updated,
          emailError: emailErr.message || "Email send failed",
        });
      }
    }

    return res.json({ success: true, message: "Order status updated", order: updated });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return res.status(500).json({ success: false, message: "Failed to update order status" });
  }
});


// PUT /api/admin/orders/:id/tracking
router.put("/:id/tracking", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid order id" });

    const { trackingId, estimatedDelivery } = req.body;
    const update = { $set: {} };
    update.$set.trackingId = trackingId || null;

    if (estimatedDelivery) {
      const d = new Date(estimatedDelivery);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid estimatedDelivery date" });
      }
      update.$set.estimatedDelivery = d;
    }

    const updated = await Order.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, message: "Tracking info updated", order: updated });
  } catch (err) {
    console.error("updateTrackingInfo error:", err);
    res.status(500).json({ success: false, message: "Failed to update tracking info" });
  }
});

// POST /api/admin/orders/:id/email
router.post("/:id/email", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid order id" });

    const order = await Order.findById(id).lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const subject = `Order ${order.orderNumber} — Update`;
    const trackLink = `${process.env.FRONTEND_URL || "https://your-frontend.example"}/track-order?email=${encodeURIComponent(order.email)}&orderNumber=${encodeURIComponent(order.orderNumber)}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
        <h2 style="color:#000">Order update — ${order.orderNumber}</h2>
        <p>Your order status is now <strong>${order.orderStatus}</strong>.</p>
        <p><a href="${trackLink}" style="background:#000;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Track your order</a></p>
      </div>
    `;

    // fire-and-forget; still respond quickly to admin
    sendEmail({ to: order.email, subject, html })
      .then(() => console.log(`Order email queued/sent to ${order.email}`))
      .catch((err) => console.error("Order email error:", err));

    res.json({ success: true, message: "Email queued" });
  } catch (err) {
    console.error("sendOrderEmail error:", err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

export default router;
