import express from 'express'
import { CartItem } from '../models/CartItem.js'
import { Product } from '../models/Product.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Helper to get cart key (user or guest)
function cartKey(req) {
  if (req.user?.id) return { user: req.user.id }
  const guestId = req.headers['x-guest-id']
  if (!guestId || typeof guestId !== 'string') return null
  return { guestId }
}

// Get cart items
router.get('/', async (req, res) => {
  const key = cartKey(req)
  if (!key) return res.json({ items: [] })

  const items = await CartItem.find(key).populate('product')
  res.json({ items })
})

// Add to cart with size support
router.post('/add', async (req, res) => {
  const key = cartKey(req); // { user: userId } or { guestId }
  const { productId, quantity = 1, size } = req.body;

  if (!key || !productId || !size)
    return res.status(400).json({ error: 'Missing fields: productId or size' });

  const product = await Product.findById(productId);
  if (!product || !product.published)
    return res.status(404).json({ error: 'Product not found' });

  // Filter includes product + size + user/guest
  const filter = { ...key, product: productId, size };

  // Increment quantity if already exists, else create new
  const update = { $inc: { quantity: Number(quantity) } };

  const item = await CartItem.findOneAndUpdate(filter, update, {
    new: true, // return updated doc
    upsert: true, // create if doesn't exist
  });

  res.json({ message: 'Added to cart', item });
});


// Update quantity
router.post('/update', async (req, res) => {
  const key = cartKey(req)
  const { productId, size, quantity } = req.body
  if (!key || !productId || !size || quantity == null) 
    return res.status(400).json({ error: 'Missing fields' })

  if (quantity <= 0) {
    await CartItem.findOneAndDelete({ ...key, product: productId, size })
    return res.json({ ok: true })
  }

  const item = await CartItem.findOneAndUpdate(
    { ...key, product: productId, size },
    { $set: { quantity } },
    { new: true }
  )
  res.json(item)
})

// Remove item
router.post('/remove', async (req, res) => {
  const key = cartKey(req)
  const { productId } = req.body
  if (!key || !productId ) return res.status(400).json({ error: 'Missing fields' })

  const result = await CartItem.findOneAndDelete({ ...key, product: productId })
  if (!result) return res.status(404).json({ error: 'Cart item not found' })

  res.json({ message: 'Product removed from cart', item: result })
})

// Merge guest cart after login
router.post('/merge', requireAuth, async (req, res) => {
  const { guestId } = req.body
  if (!guestId) return res.status(400).json({ error: 'Missing guestId' })

  const guestItems = await CartItem.find({ guestId })
  for (const gi of guestItems) {
    await CartItem.findOneAndUpdate(
      { user: req.user.id, product: gi.product, size: gi.size },
      { $inc: { quantity: gi.quantity } },
      { upsert: true, new: true }
    )
  }
  await CartItem.deleteMany({ guestId })

  const items = await CartItem.find({ user: req.user.id }).populate('product')
  res.json({ items })
})

export default router
