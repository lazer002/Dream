import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: 'text' },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    sku: { type: String, unique: true, sparse: true },
    inventory: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
    tags: [{ type: String, index: true }]
  },
  { timestamps: true }
)

export const Product = mongoose.model('Product', productSchema)


