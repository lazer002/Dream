import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: "text" },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],

    // auto-generated unique SKU (8-10 digit string)
    sku: {
      type: String,
      unique: true,
      required: true,
    },

    inventory: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
    onSale: { type: Boolean, default: false },
    isNewProduct: { type: Boolean, default: false },

    // replace tags with category
    category: {
      type: String,
      enum: ["jackets", "hoodies", "tshirts", "pants", "accessories"],
      required: true,
      index: true,
    },
    sizes: {
      type: [String], // array of strings
      enum: ["XS", "S", "M", "L", "XL", "XXL"], // allowed size values
      default: [], // default empty array
    },
  },
  { timestamps: true }
);

// Auto-generate SKU if not provided
productSchema.pre("validate", async function (next) {
  if (!this.sku) {
    let newSku;
    let exists = true;

    while (exists) {
      newSku = Math.floor(10000000 + Math.random() * 9000000000).toString(); // 8-10 digits
      exists = await mongoose.models.Product.findOne({ sku: newSku });
    }

    this.sku = newSku;
  }
  next();
});

export const Product = mongoose.model("Product", productSchema);
