import mongoose from "mongoose";
const { Schema } = mongoose;

const ReturnItemSchema = new Schema({
  orderItemId: { type: String, required: true }, // e.g. order.items._id
  productId: { type: String, required: true },
  title: { type: String, default: "" },
  variant: { type: String, default: "" },
  orderedQty: { type: Number, required: true, default: 1 },
  qty: { type: Number, required: true, default: 1 }, // qty being returned
  price: { type: Number, default: 0 },
  action: { type: String, enum: ["refund", "exchange", "repair"], default: "refund" },
  reason: { type: String, default: "" },
  photos: [{ type: String }], // store URLs or storage keys
}, { _id: false });

const StatusEntry = new Schema({
  from: { type: String },
  to: { type: String, required: true },
  by: { type: Schema.Types.ObjectId, ref: "User", default: null },
  note: { type: String, default: "" },
  at: { type: Date, default: Date.now }
}, { _id: false });

const ReturnRequestSchema = new Schema({
  rmaNumber: { type: String, required: true, unique: true, index: true }, // e.g. RMA-20251119-1234
  orderId: { type: String, required: true, index: true }, // order._id from your sample
  orderNumber: { type: String, default: null, index: true }, // e.g. DD-2025-0021
  userId: { type: Schema.Types.ObjectId, ref: "User", default: null }, // if logged in
  guestId: { type: String, default: null }, // if guest created
  guestEmail: { type: String, default: null },
  status: { type: String, enum: ["submitted","awaiting_shipment","received","inspecting","approved","rejected","refunded","completed","cancelled"], default: "submitted", index: true },
  items: { type: [ReturnItemSchema], required: true },
  details: { type: String, default: "" }, // global note
  photos: [{ type: String }], // global photos
  statusHistory: { type: [StatusEntry], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

ReturnRequestSchema.pre("validate", function(next){
  if (!this.rmaNumber) {
    const d = new Date();
    const prefix = `RMA-${d.toISOString().slice(0,10).replace(/-/g,"")}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    this.rmaNumber = `${prefix}-${random}`;
  }
  next();
});

export const Return = mongoose.model("ReturnRequest", ReturnRequestSchema);
