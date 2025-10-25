import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // optional if guest checkout
  email: { type: String, required: true },
  
  // Shipping Info
  shippingMethod: { type: String, default: "free" },
  billingSame: { type: Boolean, default: true },
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: { type: String, required: true },
    apartment: { type: String },
    city: { type: String, required: true },
    state: { type: String, default: "Delhi" },
    zip: { type: String, default: "110045" },
    country: { type: String, default: "India" },
    phone: { type: String, required: true }
  },
  saveInfo: { type: Boolean, default: false },

  // Cart Items
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      title: { type: String, required: true },
      variant: { type: String },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      total: { type: Number, required: true } // quantity * price
    }
  ],

  // Cost Summary
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 100 },
  total: { type: Number, required: true },
  discountCode: { type: String },

  // Payment Info
  payment: {
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number },
    currency: { type: String, default: "INR" },
    status: { type: String, default: "pending" } // pending, success, failed
  },

  createdAt: { type: Date, default: Date.now }
});

export const CreateOrder = mongoose.model("CreateOrder", OrderSchema);
