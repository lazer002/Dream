import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import morgan from 'morgan'
import { connectToDatabase } from './utils/db.js'
import authRouter from './routes/auth.js'
import productsRouter from './routes/products.js'
import cartRouter from './routes/cart.js'
import ordersRouter from './routes/orders.js'
import adminUsersRouter from './routes/adminUsers.js'
import uploadRouter from './routes/upload.js'
import statsRouter from './routes/stats.js'

dotenv.config()

const app = express()
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }))
app.use(express.json())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'dream-shop-backend', env: process.env.NODE_ENV || 'development' })
})

app.use('/api/auth', authRouter)
app.use('/api/products', productsRouter)
app.use('/api/cart', cartRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/admin/users', adminUsersRouter)
app.use('/api/admin/upload', uploadRouter)
app.use('/api/admin/stats', statsRouter)

const port = process.env.PORT || 4000

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`)
    })
  })
  .catch((err) => {
    console.error('Failed to start server:', err)
    process.exit(1)
  })


