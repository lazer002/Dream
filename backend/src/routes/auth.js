// routes/auth.js
//
// Login for BOTH clients. Web gets the refresh token as an httpOnly cookie,
// the app (x-platform: mobile / no Origin) gets it in the JSON body. Response
// shapes are the same as before: { user, accessToken[, refreshToken] }.

import crypto from "crypto";
import express from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { OTP } from "../models/Otp.js";
import { googleLogin, googleLoginMobile } from "../utils/gauth.js";
import { sendOtpMail } from "../utils/mailer.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter, otpSendLimiter, refreshLimiter } from "../middleware/rateLimit.js";
import { email as validEmail, str } from "../utils/validate.js";
import {
  SessionError,
  endAllSessions,
  endSession,
  publicUser,
  refreshSession,
  startSession,
} from "../utils/session.js";

const router = express.Router();

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_GAP_MS = 30 * 1000;
const OTP_MAX_PER_WINDOW = 5;
const OTP_WINDOW_MS = 15 * 60 * 1000;
const MIN_PASSWORD = 8;

const generateOtp = () =>
  crypto.randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH).toString();

const accountBlocked = (user) => user.status && user.status !== "active";

/* ---------- REGISTER ---------- */

router.post("/register", authLimiter, async (req, res) => {
  try {
    const email = validEmail(req.body?.email);
    const name = str(req.body?.name, 100);
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !name || !password) {
      return res.status(400).json({ error: "Valid name, email and password are required" });
    }

    if (password.length < MIN_PASSWORD || password.length > 128) {
      return res
        .status(400)
        .json({ error: `Password must be at least ${MIN_PASSWORD} characters` });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ email, name, passwordHash, provider: "local" });

    const tokens = await startSession(req, res, user);

    return res.json({ user: publicUser(user), ...tokens });
  } catch (e) {
    console.error("Register error:", e.message);
    return res.status(500).json({ error: "Registration failed" });
  }
});

/* ---------- PASSWORD LOGIN ---------- */

router.post("/login", authLimiter, async (req, res) => {
  try {
    const email = validEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user || !(await user.verifyPassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (accountBlocked(user)) {
      return res.status(403).json({ error: "Account disabled" });
    }

    user.lastLogin = new Date();
    await user.save();

    const tokens = await startSession(req, res, user);

    return res.json({ user: publicUser(user), ...tokens });
  } catch (e) {
    console.error("Login error:", e.message);
    return res.status(500).json({ error: "Login failed" });
  }
});

/* ---------- REFRESH (cookie for web, body for app) ---------- */

router.post("/refresh", refreshLimiter, async (req, res) => {
  try {
    const { user: _user, ...tokens } = await refreshSession(req, res);

    return res.json(tokens);
  } catch (e) {
    if (!(e instanceof SessionError)) {
      console.error("Refresh error:", e.message);
    }

    return res.status(401).json({ error: "Invalid refresh token", code: "SESSION_EXPIRED" });
  }
});

/* ---------- LOGOUT ---------- */

router.post("/logout", async (req, res) => {
  await endSession(req, res);

  return res.json({ success: true });
});

/* ---------- OTP: SEND ---------- */

router.post("/otp/send", otpSendLimiter, async (req, res) => {
  try {
    const email = validEmail(req.body?.email);

    if (!email) return res.status(400).json({ error: "Valid email required" });

    // Per-email limits (stops email bombing one address from many IPs).
    const recent = await OTP.find({
      email,
      createdAt: { $gt: new Date(Date.now() - OTP_WINDOW_MS) },
    })
      .sort({ createdAt: -1 })
      .select("createdAt")
      .lean();

    if (recent.length && Date.now() - recent[0].createdAt.getTime() < OTP_RESEND_GAP_MS) {
      return res.status(429).json({ error: "Please wait a few seconds before requesting a new code" });
    }

    if (recent.length >= OTP_MAX_PER_WINDOW) {
      return res.status(429).json({ error: "Too many codes requested, try again later" });
    }

    const existing = await User.findOne({ email }).select("status").lean();

    if (existing && accountBlocked(existing)) {
      // Same response as success: don't reveal account state.
      return res.json({ message: "OTP sent to email" });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    // Verify only ever checks the newest code; older ones expire on their own
    // (kept until then so the per-email limits above can count them).
    await OTP.create({ email, otpHash, expiresAt: new Date(Date.now() + OTP_TTL_MS) });

    await sendOtpMail(email, otp);

    return res.json({ message: "OTP sent to email" });
  } catch (e) {
    console.error("OTP send error:", e.message);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

/* ---------- OTP: VERIFY ---------- */

router.post("/otp/verify", authLimiter, async (req, res) => {
  try {
    const email = validEmail(req.body?.email);
    const otp = typeof req.body?.otp === "string" ? req.body.otp.trim() : String(req.body?.otp ?? "");

    if (!email || !/^\d{4,8}$/.test(otp)) {
      return res.status(400).json({ error: "Email and OTP required" });
    }

    const otpEntry = await OTP.findOne({ email }).sort({ createdAt: -1 });

    if (!otpEntry || otpEntry.expiresAt < new Date()) {
      if (otpEntry) await OTP.deleteOne({ _id: otpEntry._id });
      return res.status(401).json({ error: "OTP expired, request a new code" });
    }

    if (otpEntry.attempts >= OTP_MAX_ATTEMPTS) {
      await OTP.deleteOne({ _id: otpEntry._id });
      return res.status(429).json({ error: "Too many wrong attempts, request a new code" });
    }

    const isValid = await otpEntry.verifyOtp(otp);

    if (!isValid) {
      // Atomic so parallel guesses all count.
      await OTP.updateOne({ _id: otpEntry._id }, { $inc: { attempts: 1 } });
      return res.status(401).json({ error: "Invalid OTP" });
    }

    // One-time use: only one request can consume the code.
    const consumed = await OTP.deleteOne({ _id: otpEntry._id });

    if (!consumed.deletedCount) {
      return res.status(401).json({ error: "OTP expired, request a new code" });
    }

    await OTP.deleteMany({ email });

    // Account is created on first successful verification (proves the email).
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        name: "New User",
        provider: "local",
        isVerified: true,
      });
    }

    if (accountBlocked(user)) {
      return res.status(403).json({ error: "Account disabled" });
    }

    user.isVerified = true;
    user.lastLogin = new Date();
    await user.save();

    const tokens = await startSession(req, res, user);

    return res.json({ user: publicUser(user), ...tokens });
  } catch (e) {
    console.error("OTP verify error:", e.message);
    return res.status(500).json({ error: "OTP verification failed" });
  }
});

/* ---------- CHANGE / SET PASSWORD ---------- */

router.post("/change-password", requireAuth, authLimiter, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (typeof newPassword !== "string" || typeof confirmPassword !== "string") {
      return res.status(400).json({ error: "newPassword and confirmPassword are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (newPassword.length < MIN_PASSWORD || newPassword.length > 128) {
      return res
        .status(400)
        .json({ error: `Password must be at least ${MIN_PASSWORD} characters long` });
    }

    const user = await User.findById(req.user.id).select("+passwordHash");

    if (!user) return res.status(404).json({ error: "User not found" });

    // Accounts that already have a password must prove they know it.
    // Google/OTP-only accounts (no password yet) can set one while logged in.
    if (user.passwordHash) {
      if (typeof currentPassword !== "string" || !currentPassword) {
        return res
          .status(400)
          .json({ error: "currentPassword is required to change your password" });
      }

      if (!(await user.verifyPassword(currentPassword))) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      if (await user.verifyPassword(newPassword)) {
        return res
          .status(400)
          .json({ error: "New password must be different from the current password" });
      }
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    // Log out every other device, then start a fresh session here.
    await endAllSessions(user._id);
    const tokens = await startSession(req, res, user);

    return res.json({ message: "Password updated", ...tokens });
  } catch (err) {
    console.error("change-password error:", err.message);
    return res.status(500).json({ error: "Failed to change password" });
  }
});

/* ---------- CURRENT USER ---------- */

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash").lean();

    if (!user || accountBlocked(user)) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("GET /auth/me error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ---------- GOOGLE ---------- */

router.post("/google", authLimiter, googleLogin);
router.post("/google/mobile", authLimiter, googleLoginMobile);

export default router;
