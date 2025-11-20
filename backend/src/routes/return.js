// backend/src/routes/returns.js
import express from "express";
import mongoose from "mongoose";
import { Return } from "../models/Return.js";
import { Order } from "../models/Order.js"; // adjust path to your Order model

const router = express.Router();

// Helper: find order by _id or orderNumber
async function findOrderByIdOrNumber(idOrNumber) {
  if (!idOrNumber) return null;

  // try ObjectId first
  if (mongoose.Types.ObjectId.isValid(idOrNumber)) {
    const byId = await Order.findById(idOrNumber).lean();
    if (byId) return byId;
  }

  // fallback: find by orderNumber
  const byNumber = await Order.findOne({ orderNumber: idOrNumber }).lean();
  return byNumber;
}

router.post("/", async (req, res) => {
  try {
    console.log("Received return request:", req.body);
    const actor = req.user?._id || null; // if you have auth middleware

    const {
      orderId,
      orderNumber,
      guestEmail,
      items,
    } = req.body;

    // Basic guard
    if (!orderId && !orderNumber) {
      return res.status(400).json({ success: false, message: "orderId or orderNumber is required" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "items array is required" });
    }

    // Try fetch order (optional but helpful)
    const order = await findOrderByIdOrNumber(orderId || orderNumber);

    // Normalize & validate items, fill productId from order when missing
    const normalizedItems = [];

    for (const it of items) {
      if (!it || typeof it !== "object") {
        return res.status(400).json({ success: false, message: "each item must be an object" });
      }

      const { orderItemId, productId, qty = 1 } = it;
      if (!orderItemId) {
        return res.status(400).json({ success: false, message: "orderItemId required for each item" });
      }

      let finalProductId = productId || null;

      // If productId missing, try to fill from order items
      if (!finalProductId && order && Array.isArray(order.items)) {
        const match = order.items.find((oi) => {
          // support ObjectId or plain id/sku
          const oid = oi._id ? String(oi._id) : (oi.id || oi.sku);
          return oid && String(oid) === String(orderItemId);
        });
        if (match && (match.productId || match.productId === 0)) finalProductId = match.productId;
      }

      if (!finalProductId) {
        return res.status(400).json({
          success: false,
          message: `Missing productId for orderItemId ${orderItemId}. Provide productId or ensure the order has a matching item with productId.`,
        });
      }

      normalizedItems.push({
        orderItemId: String(orderItemId),
        productId: String(finalProductId),
        title: it.title || "",
        variant: it.variant || "",
        orderedQty: it.orderedQty || it.qty || 1,
        qty: Number(qty) || 1,
        price: Number(it.price || it.unitPrice || 0),
        action: it.action || "refund",
        reason: it.reason || "",
        // per-item details and photos (frontend must send these per-item)
        details: it.details || "",
        photos: Array.isArray(it.photos) ? it.photos.filter(Boolean) : [],
      });
    }

    // initial status entry (schema requires `to`)
    const initialStatus = {
      from: null,
      to: "submitted", // match schema default / enum
      by: actor,
      note: "Return request submitted",
      at: new Date(),
    };

    // Compose document according to new schema (no global details/photos/notes)
    const doc = new Return({
      orderId: String(orderId || (order && order._id) || ""),
      orderNumber: orderNumber || (order && order.orderNumber) || null,
      guestEmail: guestEmail || (order && order.email) || null,
      userId: req.user?._id || null,
      guestId: order && order.guestId ? order.guestId : null,
      items: normalizedItems,
      statusHistory: [initialStatus],
      status: initialStatus.to || "submitted",
    });

    // Save
    const saved = await doc.save();

    return res.status(201).json({ success: true, message: "Return request created", rma: saved });
  } catch (err) {
    console.error("POST /returns error:", err);

    if (err && err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: "ReturnRequest validation failed", errors: err.errors });
    }

    return res.status(500).json({ success: false, message: "Server error" });
  }
});


export default router;
