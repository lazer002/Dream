// utils/session.js
//
// ONE login/session system for both clients:
//   - web    -> refresh token in an httpOnly cookie (never readable by JS)
//   - mobile -> refresh token in the JSON body (app keeps it in the OS keystore)
// Refresh accepts either (cookie first, then body). Every refresh token belongs
// to a Session document: refresh rotates it, logout revokes it, and re-use of
// an already-rotated token revokes all of that user's sessions (token theft).

import crypto from "crypto";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import {
  REFRESH_TOKEN_TTL_DAYS,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./jwt.js";

const REFRESH_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

// Two tabs / two requests refreshing at the same moment both present the same
// token; the second one inside this window is not treated as theft.
const ROTATION_GRACE_MS = 30 * 1000;

export const REFRESH_COOKIE = "refreshToken";

export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.COOKIE_SAMESITE || "lax",
  path: "/",
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
});

/**
 * Mobile app requests: explicit `x-platform: mobile`, or no Origin header
 * (browsers always send Origin on cross-origin API calls; native apps don't).
 */
export const isMobileClient = (req) =>
  req.headers["x-platform"] === "mobile" || !req.headers.origin;

const accessPayload = (user) => ({
  id: user._id.toString(),
  role: user.role,
  email: user.email,
  name: user.name,
});

/** Public user fields returned by every login endpoint. */
export const publicUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone,
  isVerified: user.isVerified,
});

const newSession = async (req, user) => {
  const sid = crypto.randomUUID();

  await Session.create({
    sid,
    userId: user._id,
    client: isMobileClient(req) ? "mobile" : "web",
    userAgent: String(req.headers["user-agent"] || "").slice(0, 300),
    expiresAt: new Date(Date.now() + REFRESH_MS),
  });

  return sid;
};

const deliver = (req, res, user, sid) => {
  const accessToken = signAccessToken(accessPayload(user));
  const refreshToken = signRefreshToken({ id: user._id.toString(), sid });

  if (isMobileClient(req)) {
    return { accessToken, refreshToken };
  }

  res.cookie(REFRESH_COOKIE, refreshToken, { ...refreshCookieOptions(), maxAge: REFRESH_MS });

  return { accessToken };
};

/** Call after a successful login/register. Returns tokens for the JSON body. */
export async function startSession(req, res, user) {
  const sid = await newSession(req, user);

  return deliver(req, res, user, sid);
}

const readRefreshToken = (req) => {
  const fromCookie = req.cookies?.[REFRESH_COOKIE];
  const fromBody = req.body?.refreshToken;

  if (typeof fromCookie === "string" && fromCookie) return fromCookie;
  if (typeof fromBody === "string" && fromBody) return fromBody;

  return null;
};

const clearRefreshCookie = (req, res) => {
  if (req.cookies?.[REFRESH_COOKIE]) {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  }
};

export class SessionError extends Error {}

/** POST /refresh: rotate the session. Throws SessionError when it must log out. */
export async function refreshSession(req, res) {
  const token = readRefreshToken(req);

  if (!token) throw new SessionError("Missing refresh token");

  let payload;

  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(req, res);
    throw new SessionError("Invalid refresh token");
  }

  const user = await User.findById(payload.id);

  if (!user || user.status !== "active") {
    clearRefreshCookie(req, res);
    throw new SessionError("Account not available");
  }

  // Tokens issued before sessions existed (no sid): accept once, move to a session.
  if (!payload.sid) {
    return { ...deliver(req, res, user, await newSession(req, user)), user };
  }

  const session = await Session.findOne({ sid: payload.sid });

  if (!session || String(session.userId) !== String(user._id) || session.expiresAt < new Date()) {
    clearRefreshCookie(req, res);
    throw new SessionError("Session expired");
  }

  if (session.revokedAt) {
    const justRotated =
      session.replacedBy && Date.now() - session.revokedAt.getTime() < ROTATION_GRACE_MS;

    if (justRotated) {
      // Parallel refresh: give a fresh access token, keep the newer refresh token.
      return { accessToken: signAccessToken(accessPayload(user)), user };
    }

    // An old, already-used refresh token came back: assume it was stolen.
    await Session.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
    clearRefreshCookie(req, res);
    throw new SessionError("Session revoked");
  }

  const nextSid = await newSession(req, user);

  // Only one request can rotate a given session.
  const rotated = await Session.updateOne(
    { _id: session._id, revokedAt: null },
    { revokedAt: new Date(), replacedBy: nextSid },
  );

  if (!rotated.modifiedCount) {
    await Session.deleteOne({ sid: nextSid });
    return { accessToken: signAccessToken(accessPayload(user)), user };
  }

  return { ...deliver(req, res, user, nextSid), user };
}

/** POST /logout: revoke this session (idempotent, never throws). */
export async function endSession(req, res) {
  const token = readRefreshToken(req);

  clearRefreshCookie(req, res);

  if (!token) return;

  try {
    const payload = verifyRefreshToken(token);

    if (payload.sid) {
      await Session.updateOne({ sid: payload.sid, revokedAt: null }, { revokedAt: new Date() });
    }
  } catch {
    // Expired/invalid token: nothing to revoke.
  }
}

/** Log out everywhere (password change, account suspended...). */
export const endAllSessions = (userId) =>
  Session.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
