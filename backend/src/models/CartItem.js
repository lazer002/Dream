import mongoose from 'mongoose'

const cartItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    guestId: { type: String, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: 1 },
    size: { type: String } // now part of unique check
  },
  { timestamps: true }
)

// Include `size` in the unique index
cartItemSchema.index(
  { user: 1, product: 1, size: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } }
)

cartItemSchema.index(
  { guestId: 1, product: 1, size: 1 },
  { unique: true, partialFilterExpression: { guestId: { $type: 'string' } } }
)

export const CartItem = mongoose.model('CartItem', cartItemSchema)
