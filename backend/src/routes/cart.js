import express from 'express'
import { CartItem } from '../models/CartItem.js'
import { Product } from '../models/Product.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Helper to get key (user or guest)
function cartKey(req) {
  if (req.user?.id) return { user: req.user.id }
  const guestId = req.headers['x-guest-id']
  if (!guestId || typeof guestId !== 'string') return null
  return { guestId }
}

router.get('/', async (req, res) => {
  const key = cartKey(req)
  if (!key) return res.json({ items: [] })
  const items = await CartItem.find(key).populate('product')
  res.json({ items })
})

router.post('/add', async (req, res) => {
  const key = cartKey(req)
  const { productId, quantity = 1 } = req.body
  if (!key || !productId) return res.status(400).json({ error: 'Missing fields' })
  const product = await Product.findById(productId)
  if (!product || !product.published) return res.status(404).json({ error: 'Product not found' })
  const filter = { ...key, product: productId }
  const update = { $inc: { quantity: Number(quantity) } }
  const item = await CartItem.findOneAndUpdate(filter, update, { new: true, upsert: true })
  res.json(item)
})

router.post('/update', async (req, res) => {
  const key = cartKey(req)
  const { productId, quantity } = req.body
  if (!key || !productId || !quantity) return res.status(400).json({ error: 'Missing fields' })
  if (quantity <= 0) {
    await CartItem.findOneAndDelete({ ...key, product: productId })
    return res.json({ ok: true })
  }
  const item = await CartItem.findOneAndUpdate({ ...key, product: productId }, { $set: { quantity } }, { new: true })
  res.json(item)
})

// Merge guest cart into user after login
router.post('/merge', requireAuth, async (req, res) => {
  const { guestId } = req.body
  if (!guestId) return res.status(400).json({ error: 'Missing guestId' })
  const guestItems = await CartItem.find({ guestId })
  for (const gi of guestItems) {
    await CartItem.findOneAndUpdate(
      { user: req.user.id, product: gi.product },
      { $inc: { quantity: gi.quantity } },
      { upsert: true, new: true }
    )
  }
  await CartItem.deleteMany({ guestId })
  const items = await CartItem.find({ user: req.user.id }).populate('product')
  res.json({ items })
})

export default router


