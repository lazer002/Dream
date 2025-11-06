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

// Index for single product (same product + size)
cartItemSchema.index(
  { user: 1, product: 1, size: 1 },
  { unique: true, partialFilterExpression: { product: { $exists: true } } }
);
cartItemSchema.index(
  { guestId: 1, product: 1, size: 1 },
  { unique: true, partialFilterExpression: { product: { $exists: true } } }
);

// Index for bundle (unique combination of bundle + product sizes)
cartItemSchema.index(
  { user: 1, bundle: 1, "bundleProducts.product": 1, "bundleProducts.size": 1 },
  { unique: true, partialFilterExpression: { bundle: { $exists: true } } }
);
cartItemSchema.index(
  { guestId: 1, bundle: 1, "bundleProducts.product": 1, "bundleProducts.size": 1 },
  { unique: true, partialFilterExpression: { bundle: { $exists: true } } }
);

export const CartItem = mongoose.model("CartItem", cartItemSchema);
