// utils/gauth.js
//
// Google sign-in for both clients:
//   POST /api/auth/google         web: { token } = Google ID token
//   POST /api/auth/google/mobile  app: { code, codeVerifier, redirectUri } (PKCE)
// Both end in the same session system (utils/session.js).

import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import { User } from "../models/User.js";
import { startSession } from "./session.js";
import { str } from "./validate.js";

const webClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const mobileClient = new OAuth2Client(process.env.GOOGLE_CLIENT_APP);

// Redirect URIs the app may use for the PKCE code exchange. Must match what the
// app sent to Google. Comma-separated in GOOGLE_APP_REDIRECT_URIS.
const allowedAppRedirects = () =>
  (process.env.GOOGLE_APP_REDIRECT_URIS || "com.anonymous.monkey:/oauthredirect")
    .split(",")
    .map((uri) => uri.trim())
    .filter(Boolean);

const userResponse = (user) => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  role: user.role,
  avatar: user.avatar,
  wishlist: user.wishlist,
  cart: user.cart,
  addresses: user.addresses,
  lastLogin: user.lastLogin,
});

class GoogleAuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Find or create the user for a verified Google identity. */
async function userFromGoogle(payload, loginSource) {
  const { email: rawEmail, name, picture, sub, email_verified } = payload || {};

  if (!rawEmail || !sub) throw new GoogleAuthError(400, "Google account missing email");

  // Never attach a Google login to an account by an unverified email.
  if (!email_verified) throw new GoogleAuthError(401, "Google email is not verified");

  const email = String(rawEmail).toLowerCase();

  let user = await User.findOne({ email });

  if (!user) {
    try {
      user = await User.create({
        name: name || "",
        email,
        googleId: sub,
        avatar: picture || "",
        provider: "google",
        loginSource,
        role: "user",
        isVerified: true,
        lastLogin: new Date(),
      });
    } catch (createErr) {
      // Another request created the user at the same moment.
      if (createErr?.code !== 11000) throw createErr;
      user = await User.findOne({ email });
    }
  }

  if (user.status && user.status !== "active") {
    throw new GoogleAuthError(403, "Account disabled");
  }

  // The email already belongs to a different Google account.
  if (user.googleId && user.googleId !== sub) {
    throw new GoogleAuthError(401, "This email is linked to another Google account");
  }

  if (!user.googleId) user.googleId = sub;
  if (!user.name || user.name === "New User") user.name = name || user.name;
  if (picture && !user.avatar) user.avatar = picture;
  user.isVerified = true;
  user.lastLogin = new Date();

  await user.save();

  return user;
}

const sendError = (res, err, label) => {
  if (err instanceof GoogleAuthError) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  console.error(label, err.response?.data?.error || err.message);

  return res.status(401).json({ success: false, message: "Google authentication failed" });
};

/* ---------- WEB ---------- */

export const googleLogin = async (req, res) => {
  try {
    const token = str(req.body?.token, 4096);

    if (!token) return res.status(400).json({ message: "Missing Google token" });

    const ticket = await webClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const user = await userFromGoogle(ticket.getPayload(), "web");
    const tokens = await startSession(req, res, user);

    return res.json({ user: userResponse(user), ...tokens });
  } catch (err) {
    return sendError(res, err, "Google login error:");
  }
};

/* ---------- MOBILE (PKCE code exchange) ---------- */

export const googleLoginMobile = async (req, res) => {
  try {
    const code = str(req.body?.code, 2048);
    const codeVerifier = str(req.body?.codeVerifier, 256);
    const requestedRedirect = str(req.body?.redirectUri, 512);
    const allowed = allowedAppRedirects();

    if (!code || !codeVerifier) {
      return res.status(400).json({ success: false, message: "Missing authorization code" });
    }

    if (requestedRedirect && !allowed.includes(requestedRedirect)) {
      return res.status(400).json({ success: false, message: "Redirect URI not allowed" });
    }

    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_APP,
        redirect_uri: requestedRedirect || allowed[0],
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      },
      { timeout: 10000 },
    );

    const idToken = tokenRes.data?.id_token;

    if (!idToken) {
      return res.status(400).json({ success: false, message: "Failed to retrieve id_token" });
    }

    const ticket = await mobileClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_APP,
    });

    const loginSource = req.headers["x-os"] === "ios" ? "ios" : "android";
    const user = await userFromGoogle(ticket.getPayload(), loginSource);
    const tokens = await startSession(req, res, user);

    return res.json({ success: true, user: userResponse(user), ...tokens });
  } catch (err) {
    return sendError(res, err, "Google mobile login error:");
  }
};
