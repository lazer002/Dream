// Load .env BEFORE any other module reads process.env (see src/env.js).
import './env.js'
import express from 'express'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import os from 'os'
import { connectToDatabase } from './utils/db.js'
import authRouter from './routes/auth.js'
import productsRouter from './routes/products.js'
import cartRouter from './routes/cart.js'
import ordersRouter from './routes/orders.js'
import adminUsersRouter from './routes/adminUsers.js'
import uploadRouter from './routes/upload.js'
import statsRouter from './routes/stats.js'
import searchRouter from './routes/search.js'
import publicRouter from './routes/public.js'
import bundleRoutes from "./routes/bundles.js";
import adminOrdersRouter from './routes/adminOrder.js'
import adminBundleRouter from './routes/adminBundles.js'
import adminProductRouter from './routes/adminProduct.js'
import wishlistRouter from './routes/wishlist.js'
import returnsRouter from './routes/return.js'
import notificationRoutes from './routes/notification.js'
import user from './routes/user.js'
import address from './routes/address.js'
import newsletter from './routes/newsletter.js'
import contect from './routes/contect.js'
import productRequestRouter from './routes/product-request.js'
import inventoryRouter from "./routes/inventory.js";
import { apiLimiter } from './middleware/rateLimit.js'

const app = express()

// Behind nginx / a load balancer: use the client IP from X-Forwarded-For so
// rate limits are per visitor, not one shared limit for everyone.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1))
app.disable('x-powered-by')

// Security headers. This is a JSON API (no HTML), so a strict CSP is safe.
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

/* -------------------------------------------------------------------------- */
/*                         ALLOWED ORIGINS (as before)                        */
/* -------------------------------------------------------------------------- */

const allowedOrigins = [
  process.env.CLIENT_ORIGIN_WEB,
  process.env.CLIENT_ORIGIN_APP,
  process.env.LOCAL_NETWORK
].filter(Boolean)

/* -------------------------------------------------------------------------- */
/*                                CORS CONFIG                                 */
/* -------------------------------------------------------------------------- */

app.use(cors({
  origin: function (origin, callback) {
    // No Origin = mobile app / server-to-server (CORS is a browser rule).
    if (!origin) return callback(null, true)
    // Unknown sites get no CORS headers, so browsers block them.
    callback(null, allowedOrigins.includes(origin))
  },
  credentials: true,  // <-- MUST be true for cookies
}))

/* -------------------------------------------------------------------------- */
/*                             PARSERS & LOGGING                               */
/* -------------------------------------------------------------------------- */
app.use("/api/orders/webhook", express.raw({ type: "application/json", limit: "1mb" }));
app.use(express.json({ limit: "200kb" }))
app.use(express.urlencoded({ extended: false, limit: "200kb" }))
app.use(cookieParser())

// Strip MongoDB operators ($ne, $gt, $where...) and dotted keys from
// body/query/params, so user input can never change a database query.
app.use(mongoSanitize({ replaceWith: '_' }))

// Don't log query strings (they can hold emails / order numbers).
morgan.token('path', (req) => req.originalUrl.split('?')[0])
app.use(morgan(process.env.NODE_ENV === 'production'
  ? ':remote-addr :method :path :status :res[content-length] - :response-time ms'
  : 'dev'))

app.use('/api', apiLimiter)

/* -------------------------------------------------------------------------- */
/*                                 ROUTES                                      */
/* -------------------------------------------------------------------------- */

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'dream-shop-backend'
  })
})

app.use('/api/auth', authRouter)
app.use('/api/products', productsRouter)
app.use("/api/search", searchRouter)
app.use('/api/cart', cartRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/admin', adminUsersRouter)
app.use('/api/admin/upload', uploadRouter)
app.use('/api/admin/stats', statsRouter)
app.use("/api/bundles", bundleRoutes)
app.use('/api/admin/orders', adminOrdersRouter)
app.use('/api/admin/bundles', adminBundleRouter)
app.use('/api/admin/products', adminProductRouter)
app.use('/api', publicRouter)
app.use('/api/wishlist', wishlistRouter)
app.use('/api/returns', returnsRouter)
app.use("/api/notifications", notificationRoutes);
app.use('/api/user', user)
app.use('/api/address', address)
app.use('/api/newsletter', newsletter)
app.use('/api/contact', contect)
app.use('/api/product-request', productRequestRouter)
app.use("/api/inventory", inventoryRouter);

/* -------------------------------------------------------------------------- */
/*                       404 + ERROR HANDLER (no internals)                    */
/* -------------------------------------------------------------------------- */

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request too large' })
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl.split('?')[0]}]`, err.message)
  }

  res.status(status).json({ error: status >= 500 ? 'Something went wrong' : err.message })
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason instanceof Error ? reason.message : reason)
})

/* -------------------------------------------------------------------------- */
/*                           SERVER START + LOCAL IP                           */
/* -------------------------------------------------------------------------- */

const port = process.env.PORT || 4000

function getLocalExternalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return 'localhost'
}

connectToDatabase().then(() => {
  app.listen(port, () => {
    const localIP = getLocalExternalIP()
    console.log(`API running on: http://${localIP}:${port}`)
    console.log(`Also accessible on localhost:${port}`)
  })
}).catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
