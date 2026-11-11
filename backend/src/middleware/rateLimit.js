// middleware/rateLimit.js
//
// Per-IP limits (needs `app.set("trust proxy", ...)` in server.js so req.ip is
// the real client behind nginx/ALB, not the proxy). Same limits for web and
// app. Per-email OTP limits live in routes/auth.js (stored in the database).

import rateLimit from "express-rate-limit";

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: message, code: "RATE_LIMITED" },
  });

/** Everything under /api: generous, only stops floods/scrapers. */
export const apiLimiter = make(60 * 1000, 300, "Too many requests, please slow down");

/** Password login, register, OTP verify, Google login. */
export const authLimiter = make(15 * 60 * 1000, 30, "Too many login attempts, try again later");

/** Sending OTP emails. */
export const otpSendLimiter = make(15 * 60 * 1000, 8, "Too many codes requested, try again later");

/** Token refresh (called automatically by clients). */
export const refreshLimiter = make(15 * 60 * 1000, 120, "Too many requests");

/** Placing orders. */
export const orderLimiter = make(10 * 60 * 1000, 15, "Too many orders, try again later");

/** Payment verification calls (each one hits the Razorpay API). */
export const paymentCheckLimiter = make(15 * 60 * 1000, 40, "Too many requests");

/** Anything that sends an email or creates a ticket (track-email, returns...). */
export const emailActionLimiter = make(15 * 60 * 1000, 10, "Too many requests, try again later");

/** Newsletter / contact / product request forms. */
export const formLimiter = make(60 * 1000, 5, "Too many requests, try again in a minute");

/** Image uploads. */
export const uploadLimiter = make(15 * 60 * 1000, 30, "Too many uploads, try again later");
