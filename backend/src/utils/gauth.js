import { OAuth2Client } from 'google-auth-library'
import { User } from '../models/User.js'
import { signAccessToken, signRefreshToken } from '../utils/jwt.js' // your JWT utils

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ message: 'Missing Google token' })

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // must match frontend
    })
    const { email, name, picture } = ticket.getPayload()

    // Find or create user
    let user = await User.findOne({ email })
    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: picture,
        provider: 'google',
        role: 'user',
        isVerified: true,
        wishlist: [],
        cart: [],
        addresses: [],
        lastLogin: new Date()
      })
    } else {
      // Update last login
      user.lastLogin = new Date()
      await user.save()
    }

    // Payload for JWT
    const payload = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name
    }

    // Generate tokens
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        wishlist: user.wishlist,
        cart: user.cart,
        addresses: user.addresses,
        lastLogin: user.lastLogin
      },
      accessToken,
      refreshToken
    })
  } catch (err) {
    console.error('Google login error:', err)
    res.status(401).json({ message: 'Invalid Google token' })
  }
}
