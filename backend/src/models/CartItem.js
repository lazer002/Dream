import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    guestId: { type: String, index: true },

    // Single product
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    size: { type: String },

    // Bundle
    bundle: { type: mongoose.Schema.Types.ObjectId, ref: "Bundle" },
    mainImage: { type: String },
    bundleProducts: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        size: { type: String },
        quantity: { type: Number, default: 1 },
      },
    ],

    quantity: { type: Number, default: 1, min: 1 }, // applies to bundle or single product
  },
  { timestamps: true }
);

/* 
---------------------------------------------------
🧩 FIXED INDEXES (Safe for all cases)
---------------------------------------------------
*/

// 🔹 1. Single product (for logged-in users)
cartItemSchema.index(
  { user: 1, product: 1, size: 1 },
  {
    unique: true,
    partialFilterExpression: {
      user: { $exists: true, $ne: null },
      product: { $exists: true },
      bundle: { $exists: false }, // 👈 ensures bundle items don't conflict
    },
  }
);

// 🔹 2. Single product (for guest users)
cartItemSchema.index(
  { guestId: 1, product: 1, size: 1 },
  {
    unique: true,
    partialFilterExpression: {
      guestId: { $exists: true, $ne: null },
      product: { $exists: true },
      bundle: { $exists: false },
    },
  }
);

// 🔹 3. Bundle (for logged-in users)
cartItemSchema.index(
  { user: 1, bundle: 1 },
  {
    unique: true,
    partialFilterExpression: {
      user: { $exists: true, $ne: null },
      bundle: { $exists: true },
    },
  }
);

// 🔹 4. Bundle (for guest users)
cartItemSchema.index(
  { guestId: 1, bundle: 1 },
  {
    unique: true,
    partialFilterExpression: {
      guestId: { $exists: true, $ne: null },
      bundle: { $exists: true },
    },
  }
);

export const CartItem = mongoose.model("CartItem", cartItemSchema);
