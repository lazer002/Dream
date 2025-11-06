import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "GuestUser", required: false },

    shippingMethod: { type: String, default: "free" },
    billingSame: { type: Boolean, default: true },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        bundleId: { type: mongoose.Schema.Types.ObjectId, ref: "Bundle", default: null },
        title: { type: String, required: true },
        variant: { type: String, default: "" },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        total: { type: Number, required: true },
        bundleProducts: [
          {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            title: String,
            variant: String,
            quantity: Number,
            price: Number,
          },
        ],
      },
    ],

    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 100 },
    total: { type: Number, required: true },
    discountCode: { type: String, default: "" },

    paymentMethod: { type: String, enum: ["cod", "razorpay"], required: true },
    paymentStatus: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "dispatched", "delivered", "canceled"],
      default: "pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "confirmed", "dispatched", "delivered", "canceled"],
          required: true,
        },
        updatedAt: { type: Date, default: Date.now },
      },
    ],

    shippingAddress: {
      firstName: String,
      lastName: String,
      address: String,
      apartment: String,
      city: String,
      state: String,
      zip: String,
      country: String,
      phone: String,
    },
  },
  { timestamps: true }
);

// Pre-save hook to push initial status
OrderSchema.pre("save", function (next) {
  if (this.isNew) {
    this.statusHistory.push({ status: this.orderStatus });
  }
  next();
});

export const CreateOrder = mongoose.model("Order", OrderSchema);
