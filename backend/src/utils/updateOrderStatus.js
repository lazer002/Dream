import { CreateOrder } from "../models/Order.js";

export async function updateOrderStatus(orderId, newStatus, actor = null) {
  const valid = ["pending", "confirmed", "dispatched", "delivered", "canceled"];
  if (!valid.includes(newStatus)) throw new Error("Invalid status");

  // Optionally: avoid duplicate history entry if same status
  const current = await CreateOrder.findById(orderId).select("orderStatus").lean();
  if (!current) throw new Error("Order not found");
  if (current.orderStatus === newStatus) return current; // no-op

  const pushEntry = { status: newStatus, updatedAt: new Date() };
  if (actor) pushEntry.by = actor; // optional: who changed it

  const updated = await CreateOrder.findByIdAndUpdate(
    orderId,
    { $set: { orderStatus: newStatus }, $push: { statusHistory: pushEntry } },
    { new: true, runValidators: true }
  ).lean();

  return updated;
}
