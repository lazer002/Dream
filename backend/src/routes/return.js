// routes/return.js
//
// Returns / exchanges / repairs for web and app.
// Rules (server side, same for both clients):
//   - only the order's owner can create or read its returns
//     (logged-in user, or the guest who placed it: x-guest-id or order email)
//   - only delivered orders, inside the return window
//   - item, price and quantity come from the stored order, never the request
//   - a unit can't be returned twice
//   - only admins can change a return's status or list all returns

import express from "express";
import mongoose from "mongoose";
import { Return } from "../models/Return.js";
import { Order } from "../models/Order.js";
import { requireAuth, requireAdmin, optionalAuth, isActiveAdmin } from "../middleware/auth.js";
import { emailActionLimiter } from "../middleware/rateLimit.js";
import { getEmailTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "../utils/sendEmail.js";
import { email as validEmail, quantity as validQuantity, str } from "../utils/validate.js";

const router = express.Router();

const RETURN_WINDOW_DAYS = Number(process.env.RETURN_WINDOW_DAYS || 7);
const MAX_PHOTOS = 6;

/* =========================================================
   HELPERS
========================================================= */

async function findOrderByIdOrNumber(idOrNumber) {
  const value = str(idOrNumber, 100);

  if (!value) return null;

  if (mongoose.isValidObjectId(value)) {
    const byId = await Order.findById(value).lean();

    if (byId) return byId;
  }

  return Order.findOne({ orderNumber: value }).lean();
}

/** Does this request belong to the order's owner? */
function ownsOrder(order, req, providedEmail) {
  if (!order) return false;

  const userId = req.user?.id;

  if (order.userId) {
    // Account order: only that account (or the same email after registering).
    return (
      Boolean(userId) &&
      (String(order.userId) === String(userId) ||
        (req.user.email && String(order.email).toLowerCase() === req.user.email.toLowerCase()))
    );
  }

  // Guest order: the same guest device, the same email account, or the order email.
  if (req.guestId && order.guestId && String(order.guestId) === req.guestId) return true;

  if (userId && req.user.email && String(order.email).toLowerCase() === req.user.email.toLowerCase()) {
    return true;
  }

  return Boolean(providedEmail) && String(order.email).toLowerCase() === providedEmail;
}

function ownsReturn(ret, req) {
  if (!ret) return false;
  if (req.user?.id && ret.userId && String(ret.userId) === String(req.user.id)) return true;
  if (req.guestId && ret.guestId && String(ret.guestId) === req.guestId) return true;
  if (req.user?.email && ret.guestEmail && ret.guestEmail.toLowerCase() === req.user.email.toLowerCase()) {
    return true;
  }

  return false;
}

const RETURNABLE_STATUSES = new Set([
  "delivered",
  "return requested",
  "return approved",
  "return rejected",
  "exchange requested",
  "exchange approved",
  "exchange rejected",
  "repair requested",
  "repair approved",
  "repair rejected",
]);

function deliveredAt(order) {
  const entry = [...(order.statusHistory || [])].reverse().find((h) => h.status === "delivered");

  return entry ? new Date(entry.updatedAt || order.updatedAt) : null;
}

const cleanPhotos = (photos) =>
  (Array.isArray(photos) ? photos : [])
    .map((p) => str(p, 500))
    .filter((p) => p && /^https:\/\//i.test(p))
    .slice(0, MAX_PHOTOS);

/* =========================================================
   ACTION -> ORDER STATUS
========================================================= */

const ACTION_ORDER_STATUS = {
  refund: "return requested",
  exchange: "exchange requested",
  repair: "repair requested",
};

/* =========================================================
   CREATE RETURN / EXCHANGE / REPAIR REQUEST
========================================================= */

router.post("/", optionalAuth, emailActionLimiter, async (req, res) => {
  try {
    const { orderId, orderNumber, items } = req.body || {};
    const providedEmail = validEmail(req.body?.guestEmail || req.body?.email);

    if (!orderId && !orderNumber) {
      return res.status(400).json({ success: false, message: "orderId or orderNumber is required" });
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({ success: false, message: "items array is required" });
    }

    const order = await findOrderByIdOrNumber(orderId || orderNumber);

    // Same answer for "not found" and "not yours": don't reveal other orders.
    if (!order || !ownsOrder(order, req, providedEmail)) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!RETURNABLE_STATUSES.has(order.orderStatus)) {
      return res
        .status(400)
        .json({ success: false, message: "Only delivered orders can be returned" });
    }

    const delivered = deliveredAt(order);

    if (!delivered) {
      return res
        .status(400)
        .json({ success: false, message: "Only delivered orders can be returned" });
    }

    if (Date.now() - delivered.getTime() > RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: `Returns are accepted within ${RETURN_WINDOW_DAYS} days of delivery`,
      });
    }

    // Units already in an open/accepted return for this order.
    const previous = await Return.find({
      orderId: String(order._id),
      status: { $nin: ["rejected", "cancelled"] },
    })
      .select("items.orderItemId items.qty")
      .lean();

    const alreadyRequested = new Map();
    previous.forEach((r) =>
      r.items.forEach((it) =>
        alreadyRequested.set(it.orderItemId, (alreadyRequested.get(it.orderItemId) || 0) + it.qty),
      ),
    );

    const normalizedItems = [];
    const seen = new Set();

    for (const it of items) {
      if (!it || typeof it !== "object") {
        return res.status(400).json({ success: false, message: "Each item must be an object" });
      }

      const orderItemId = str(it.orderItemId, 100);
      const orderItem = (order.items || []).find((oi) => String(oi._id) === orderItemId);

      if (!orderItemId || !orderItem || seen.has(orderItemId)) {
        return res.status(400).json({ success: false, message: "Invalid order item" });
      }

      seen.add(orderItemId);

      const action = it.action || "refund";

      if (!["refund", "exchange", "repair"].includes(action)) {
        return res.status(400).json({ success: false, message: "Invalid action" });
      }

      const orderedQty = Number(orderItem.quantity) || 1;
      const remaining = orderedQty - (alreadyRequested.get(orderItemId) || 0);
      const qty = validQuantity(it.qty ?? 1, orderedQty);

      if (!qty || qty > remaining) {
        return res.status(400).json({
          success: false,
          message:
            remaining > 0
              ? `You can return at most ${remaining} of "${orderItem.title}"`
              : `"${orderItem.title}" already has a return request`,
        });
      }

      normalizedItems.push({
        orderItemId,
        productId: String(orderItem.productId || orderItem.bundleId || orderItemId),
        title: orderItem.title || "",
        variant: orderItem.variant || "",
        orderedQty,
        qty,
        price: Number(orderItem.price) || 0, // unit price from the order
        action,
        reason: str(it.reason, 200) || "",
        details: str(it.details, 2000) || "",
        photos: cleanPhotos(it.photos),
        exchangeSize: action === "exchange" ? str(it.exchangeSize, 20) : null,
      });
    }

    const saved = await new Return({
      orderId: String(order._id),
      orderNumber: order.orderNumber || null,
      guestEmail: order.email || null,
      userId: req.user?.id || order.userId || null,
      guestId: order.guestId || null,
      pickupAddress: str(req.body?.pickupAddress, 500) || "",
      phone: str(req.body?.phone, 20) || "",
      items: normalizedItems,
      statusHistory: [
        {
          from: null,
          to: "submitted",
          by: req.user?.id || null,
          note: "Return request submitted",
          at: new Date(),
        },
      ],
      status: "submitted",
    }).save();

    const actions = [...new Set(normalizedItems.map((item) => item.action))];
    const newOrderStatus =
      // Mixed actions: "service requested" is not a valid order status.
      actions.length === 1 ? ACTION_ORDER_STATUS[actions[0]] : "return requested";

    // The Order pre("findOneAndUpdate") hook records statusHistory.
    await Order.findByIdAndUpdate(
      order._id,
      { $set: { orderStatus: newOrderStatus } },
      { new: true, runValidators: true },
    ).catch((err) => console.error("Return order status update failed:", err.message));

    try {
      const { subject, text, html } = getEmailTemplate({
        status: newOrderStatus,
        order,
        actor: req.user?.id || null,
      });

      // Always the order's own email, never an address from the request.
      await sendEmail({ to: order.email, subject, text, html });
    } catch (err) {
      console.error("Return email error:", err.message);
    }

    return res.status(201).json({
      success: true,
      message: "Return request created",
      orderStatus: newOrderStatus,
      rma: saved,
    });
  } catch (err) {
    console.error("POST /returns error:", err.message);

    if (err?.name === "ValidationError") {
      return res.status(400).json({ success: false, message: "Invalid return request" });
    }

    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =========================================================
   GET RETURN BY ORDER NUMBER (owner only)
========================================================= */

router.get("/order/:orderNumber", optionalAuth, async (req, res) => {
  try {
    const order = await findOrderByIdOrNumber(req.params.orderNumber);

    if (!order || !ownsOrder(order, req, validEmail(req.query.email))) {
      return res.status(404).json({ message: "No return found" });
    }

    const ret = await Return.findOne({ orderId: String(order._id) }).sort({ createdAt: -1 }).lean();

    if (!ret) return res.status(404).json({ message: "No return found" });

    return res.json(ret);
  } catch (err) {
    console.error("GET /returns/order error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

/* =========================================================
   GET ALL RETURNS (admin)
========================================================= */

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const q = {};
    const orderNumber = str(req.query.orderNumber, 100);
    const rmaNumber = str(req.query.rmaNumber, 100);

    if (orderNumber) q.orderNumber = orderNumber;
    if (rmaNumber) q.rmaNumber = rmaNumber;

    const returns = await Return.find(q)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 20, 100))
      .lean();

    return res.json(returns);
  } catch (err) {
    console.error("GET /returns error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

/* =========================================================
   MY RETURNS
========================================================= */

router.get("/mine", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const ors = [];

    if (userId) {
      ors.push({ userId });
      if (req.user.email) ors.push({ guestEmail: req.user.email.toLowerCase() });
    }

    if (req.guestId) ors.push({ guestId: req.guestId });

    if (!ors.length) {
      return res
        .status(401)
        .json({ success: false, message: "User or guest identity required" });
    }

    const requests = await Return.find({ $or: ors }).sort({ createdAt: -1 }).limit(50).lean();

    const orderIds = requests.map((item) => item.orderId).filter((id) => mongoose.isValidObjectId(id));

    const orders = await Order.find({ _id: { $in: orderIds } })
      .select("orderNumber orderStatus items total subtotal createdAt shippingAddress paymentMethod")
      .lean();

    const orderMap = new Map(orders.map((order) => [String(order._id), order]));

    const result = requests.map((request) => ({
      ...request,
      order: orderMap.get(String(request.orderId)) || null,
    }));

    return res.json({ success: true, count: result.length, requests: result });
  } catch (error) {
    console.error("GET /returns/mine error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =========================================================
   GET RETURN BY RMA (owner or admin)
========================================================= */

router.get("/:rmaNumber", optionalAuth, async (req, res) => {
  try {
    const rmaNumber = str(req.params.rmaNumber, 100);

    if (!rmaNumber) {
      return res.status(400).json({ success: false, message: "RMA number is required" });
    }

    const returnReq = await Return.findOne({ rmaNumber }).lean();

    const allowed =
      ownsReturn(returnReq, req) || (Boolean(returnReq) && (await isActiveAdmin(req.user?.id)));

    if (!returnReq || !allowed) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    return res.json({ success: true, returnRequest: returnReq });
  } catch (error) {
    console.error("GET /returns/:rmaNumber error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =========================================================
   UPDATE RETURN STATUS (admin)
========================================================= */

const RETURN_STATUSES = [
  "submitted",
  "awaiting_shipment",
  "received",
  "inspecting",
  "approved",
  "refunded",
  "completed",
  "rejected",
  "cancelled",
];

router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const status = str(req.body?.status, 50);
    const note = str(req.body?.note, 1000) || "";

    if (!status || !RETURN_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    const ret = await Return.findById(id);

    if (!ret) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    const prevStatus = ret.status;

    ret.status = status;
    ret.statusHistory.push({
      from: prevStatus,
      to: status,
      by: req.user.id,
      note,
      at: new Date(),
    });

    const saved = await ret.save();

    return res.json({ success: true, message: "Status updated", rma: saved });
  } catch (error) {
    console.error("PATCH /returns/:id/status error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error while updating status" });
  }
});

export default router;
