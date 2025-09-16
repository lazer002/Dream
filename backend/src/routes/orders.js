import express from 'express'
import { Order } from '../models/Order.js'
import { CartItem } from '../models/CartItem.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Create order from current user's cart (payment stubbed)
router.post('/', requireAuth, async (req, res) => {
  const items = await CartItem.find({ user: req.user.id }).populate('product')
  if (items.length === 0) return res.status(400).json({ error: 'Cart is empty' })
  const orderItems = items.map((ci) => ({
    product: ci.product._id,
    title: ci.product.title,
    price: ci.product.price,
    quantity: ci.quantity
  }))
  const subtotal = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0)
  const order = await Order.create({ user: req.user.id, items: orderItems, subtotal })
  await CartItem.deleteMany({ user: req.user.id })
  res.status(201).json(order)
})

router.get('/me', requireAuth, async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 })
  res.json({ items: orders })
})

// Admin list all orders
router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  const orders = await Order.find({}).sort({ createdAt: -1 })
  res.json({ items: orders })
})

export default router


