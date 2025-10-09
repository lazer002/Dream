import express from 'express'
import { User } from '../models/User.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { googleLogin } from '../utils/gauth.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body
    if (!email || !name || !password) return res.status(400).json({ error: 'Missing fields' })
    const existing = await User.findOne({ email })
    if (existing) return res.status(409).json({ error: 'Email already registered' })
    const passwordHash = await User.hashPassword(password)
    const user = await User.create({ email, name, passwordHash })
    const payload = { id: user._id.toString(), role: user.role, email: user.email, name: user.name }
    res.json({
      user: { id: payload.id, email: user.email, name: user.name, role: user.role },
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload)
    })
  } catch (e) {
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await user.verifyPassword(password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const payload = { id: user._id.toString(), role: user.role, email: user.email, name: user.name }
    res.json({
      user: { id: payload.id, email: user.email, name: user.name, role: user.role },
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload)
    })
  } catch (e) {
    res.status(500).json({ error: 'Login failed' })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'Missing refreshToken' })
    const payload = verifyRefreshToken(refreshToken)
    const accessToken = signAccessToken({ id: payload.id, role: payload.role, email: payload.email, name: payload.name })
    res.json({ accessToken })
  } catch (e) {
    res.status(401).json({ error: 'Invalid refresh token' })
  }
})

router.post("/google", googleLogin);

export default router


