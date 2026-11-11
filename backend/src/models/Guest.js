import mongoose from "mongoose";

/* ================= ADDRESS ================= */

const addressSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    firstName: {
      type: String,
      trim: true,
      default: "",
    },

    lastName: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    apartment: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    zip: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      trim: true,
      default: "India",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

/* ================= GUEST CART ITEM ================= */

const GuestCartItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["product", "bundle"],
      required: true,
      default: "product",
    },

    publicId: {
      type: String,
      default: null,
    },

    size: {
      type: String,
      default: null,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    isCustomBundle: {
      type: Boolean,
      default: false,
    },

    bundle: {
      publicId: {
        type: String,
        default: null,
      },

      title: {
        type: String,
        default: null,
      },

      price: {
        type: Number,
        default: 0,
      },

      mainImage: {
        type: String,
        default: null,
      },
    },

    bundleProducts: [
      {
        publicId: {
          type: String,
          required: true,
        },

        sku: {
          type: String,
          default: null,
        },

        title: {
          type: String,
          default: null,
        },

        image: {
          type: String,
          default: null,
        },

        size: {
          type: String,
          default: null,
        },

        quantity: {
          type: Number,
          min: 1,
          default: 1,
        },
      },
    ],

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

/* ================= GUEST ================= */

const GuestSchema = new mongoose.Schema(
  {
    guestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    wishlist: {
      type: [String],
      default: [],
    },

    cart: {
      type: [GuestCartItemSchema],
      default: [],
    },

    addresses: {
      type: [addressSchema],
      default: [],
    },

    createdAt: {
      type: Date,
      default: Date.now,
      expires: "30d",
    },
  },
  {
    timestamps: true,
  }
);

export const Guest = mongoose.model(
  "Guest",
  GuestSchema
);