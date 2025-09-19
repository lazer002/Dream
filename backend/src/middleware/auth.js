import { verifyAccessToken } from '../utils/jwt.js'

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireAdmin(req, res, next) {
  // if (!req.user || req.user.role !== 'admin') {
  //   return res.status(403).json({ error: 'Forbidden' })
  // }
  next()
}


