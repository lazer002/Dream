import express from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { User } from '../models/User.js'
import { Product } from '../models/Product.js'
import { CreateOrder } from '../models/CreateOrder.js'

const router = express.Router()

router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  const [users, products, orders] = await Promise.all([
    User.countDocuments({}),
    Product.countDocuments({}),
    CreateOrder.countDocuments({})
  ])
  const lastOrders = await CreateOrder.find({}).sort({ createdAt: -1 }).limit(5)
  const revenue = await CreateOrder.aggregate([
    { $group: { _id: null, total: { $sum: '$subtotal' } } }
  ])
  res.json({
    users,
    products,
    orders,
    revenue: revenue[0]?.total || 0,
    lastOrders
  })
})

export default router


