import express from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { User } from '../models/User.js'

const router = express.Router()

router.use(requireAuth, requireAdmin)

// List users
router.get('/', async (_req, res) => {
  const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 })
  res.json({ items: users })
})

// Update role
router.patch('/:id', async (req, res) => {
  const { role, name } = req.body
  const update = {}
  if (role) update.role = role
  if (name) update.name = name
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, projection: { passwordHash: 0 } })
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json(user)
})

// Delete user
router.delete('/:id', async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id)
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

export default router


