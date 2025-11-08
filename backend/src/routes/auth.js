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
router.post('/otp/send', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Create user if not exists
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name: 'New User' });
    }

    // Generate OTP and hash it
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 5 min expiry

    // Save OTP in OTP collection
    await OTP.create({ email, otpHash, expiresAt });

    // Send OTP email
    await sendOtpMail(email, otp);

    res.json({ message: 'OTP sent to email' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});


router.post('/otp/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'User not found' });

    // Find latest OTP for this email
    const otpEntry = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (!otpEntry) return res.status(401).json({ error: 'OTP not found or expired' });


    // Check expiry
    if (otpEntry.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpEntry._id }); // remove expired OTP
      return res.status(401).json({ error: 'OTP expired' });
    }

    // Verify OTP
    const isValid = await otpEntry.verifyOtp(otp);
    if (!isValid) return res.status(401).json({ error: 'Invalid OTP' });

    // OTP verified: delete entry and update user
    await OTP.deleteOne({ _id: otpEntry._id });
    user.isVerified = true;
    user.lastLogin = new Date();
    await user.save();

    const payload = { id: user._id.toString(), role: user.role, email: user.email, name: user.name };
    res.json({
      user: { id: payload.id, email: user.email, name: user.name, role: user.role },
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

router.post("/google", googleLogin);

export default router


