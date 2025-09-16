import express from 'express'
import { Product } from '../models/Product.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const { q, limit = 20, page = 1 } = req.query
  const filter = { published: true }
  if (q) {
    filter.$text = { $search: q }
  }
  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
  const total = await Product.countDocuments(filter)
  res.json({ items: products, total })
})

router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product || !product.published) return res.status(404).json({ error: 'Not found' })
  res.json(product)
})

// Admin CRUD
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const product = await Product.create(req.body)
  res.status(201).json(product)
})

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!product) return res.status(404).json({ error: 'Not found' })
  res.json(product)
})

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

export default router


