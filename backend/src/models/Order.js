import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: String,
    price: Number,
    quantity: { type: Number, default: 1 }
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled'], default: 'pending' }
  },
  { timestamps: true }
)

export const Order = mongoose.model('Order', orderSchema)


