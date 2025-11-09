// utils/updateOrderStatus.js
import Order from "../models/Order.js";
import { isValidObjectId } from "mongoose";
import { sendEmail } from "./sendEmail.js";

/** canonical statuses (lowercase) */
export const VALID_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "dispatched",
  "shipped",
  "out for delivery",
  "delivered",
  "cancelled",
  "refunded",
];

export async function updateOrderStatus(orderId, status, opts = {}) {
  const {
    actor = null,
    reason = null,
    sendEmail: shouldSendEmail = false,
    textContent = null,
    subject = null,
    awaitEmail = false, // if true, function waits for sendEmail to finish
  } = opts;

  if (!orderId || !isValidObjectId(orderId)) {
    return { success: false, error: new Error("Invalid orderId") };
  }
  if (!status || typeof status !== "string") {
    return { success: false, error: new Error("Status is required") };
  }

  const normalized = status.trim().toLowerCase();
  if (!VALID_STATUSES.includes(normalized)) {
    return { success: false, error: new Error("Invalid status") };
  }

  // lightweight read to check current value and email/orderNumber
  const current = await Order.findById(orderId).select("orderStatus email orderNumber").lean();
  if (!current) {
    return { success: false, error: new Error("Order not found") };
  }

  if (String(current.orderStatus).toLowerCase() === normalized) {
    return { success: true, message: "Status unchanged", order: current };
  }

  // prepare history entry (front of array)
  const historyEntry = {
    status: normalized,
    by: actor || undefined,
    reason: reason || undefined,
    createdAt: new Date(),
  };

  // update DB
  const updated = await Order.findByIdAndUpdate(
    orderId,
    {
      $set: { orderStatus: normalized, updatedAt: new Date() },
      $push: { statusHistory: { $each: [historyEntry], $position: 0 } },
    },
    { new: true, runValidators: true }
  ).lean();

  // default email content
  let emailResult = null;
  if (shouldSendEmail) {
    const to = updated.email;
    const mailSubject = subject || `Order ${updated.orderNumber} — status: ${normalized}`;
    const mailText = textContent || `Hello,\n\nYour order ${updated.orderNumber} status has been updated to "${normalized}".\n\nThank you.`;

    // fire-and-forget by default (non-blocking)
    const sendPromise = sendEmail({ to, subject: mailSubject, text: mailText, html: null });

    if (awaitEmail) {
      // caller explicitly wants to wait for result
      try {
        emailResult = await sendPromise;
      } catch (err) {
        emailResult = { success: false, error: err };
      }
    } else {
      // non-blocking: attach catch to prevent unhandled rejections and log errors
      sendPromise
        .then((r) => {
          if (!r.success) console.error("async email failed:", r.error);
        })
        .catch((err) => {
          console.error("async sendEmail threw:", err);
        });
      // indicate we started async send
      emailResult = { queued: false, async: true };
    }
  }

  return { success: true, order: updated, emailResult };
}
