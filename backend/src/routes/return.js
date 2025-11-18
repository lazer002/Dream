// routes/returns.js
import express from "express";
import mongoose from "mongoose";
import {Return } from "../models/Return.js"; 
import { Order } from "../models/Order.js";
import { requireAuth } from "../middleware/auth.js"; // sets req.userId or req.user

const router = express.Router();

function tryObjectId(id) {
  try {
    return mongoose.Types.ObjectId(id);
  } catch (e) {
    return null;
  }
}

router.post("/", async (req, res) => {
  console.log("Received return request:", req.body);
  try {
    const actor = req.user?._id || null; 
    const {
      orderId,
      orderNumber,
      guestEmail,
      items = [],
      details = "",
      photos = [],
      notes = "",
    } = req.body;

    // Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items provided for return." });
    }

    // Try to link to order (optional)
    let orderDoc = null;
    if (orderId) {
      const oid = tryObjectId(orderId);
      if (oid) {
        orderDoc = await Order.findById(oid).lean();
      }
    }
    if (!orderDoc && orderNumber) {
      orderDoc = await Order.findOne({ orderNumber }).lean();
    }

    // Build Return doc
    const newReturn = new ReturnModel({
      orderId: orderDoc ? orderDoc._id : undefined,
      orderNumber: orderDoc ? orderDoc.orderNumber : orderNumber || undefined,
      userId: orderDoc ? orderDoc.userId : undefined,
      guestEmail: guestEmail || (orderDoc ? orderDoc.email : ""),
      items: items.map((it) => ({
        orderItemId: it.orderItemId || it.itemId || it.id || "",
        productId: tryObjectId(it.productId) || null,
        title: it.title || it.name || "",
        variant: it.variant || it.size || "",
        price: Number(it.price || 0),
        qty: Number(it.qty || 1),
        action: it.action || "refund",
        reason: it.reason || "",
        exchangeSize: it.exchangeSize || null,
        details: it.details || "",
        photos: Array.isArray(it.photos) ? it.photos : [],
      })),
      details: details || "",
      notes: notes || "",
      photos: Array.isArray(photos) ? photos : [],
      createdBy: actor || undefined,
      statusHistory: [{
        status: "pending",
        actor: actor || null,
        reason: "Created by customer",
        createdAt: new Date(),
      }],
    });

    await newReturn.save();

    // Optionally update linked order: push statusHistory and set orderStatus
    if (orderDoc) {
      const update = {
        $push: {
          statusHistory: {
            status: "return_requested",
            updatedAt: new Date(),
          },
        },
        $set: {
          orderStatus: "return_requested",
          updatedAt: new Date(),
        },
      };

      // Use findByIdAndUpdate so we don't need to load full order again
      await Order.findByIdAndUpdate(orderDoc._id, update, { new: true }).catch((e) => {
        // non-fatal; log and continue
        console.error("Failed to update order with return status:", e);
      });
    }

    // Response shape: include the return object plus optional brief order
    return res.status(201).json({
      success: true,
      message: "Return created",
      rma: {
        id: newReturn._id,
        status: newReturn.status,
      },
      return: newReturn,
      order: orderDoc || null,
    });
  } catch (err) {
    console.error("POST /returns error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * GET /returns/:id
 * Fetch a return record (for status page)
 */
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const oid = tryObjectId(id);
    if (!oid) return res.status(400).json({ success: false, message: "Invalid id" });

    const ret = await ReturnModel.findById(oid).lean();
    if (!ret) return res.status(404).json({ success: false, message: "Return not found" });

    return res.json({ success: true, return: ret });
  } catch (err) {
    console.error("GET /returns/:id error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
