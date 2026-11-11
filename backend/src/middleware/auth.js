// middleware/auth.js
//
// Same rules for web and app: identity comes from the Bearer access token;
// guests are identified by the `x-guest-id` header (validated, see
// utils/validate.js guestId).

import { verifyAccessToken } from "../utils/jwt.js";
import { guestId as validGuestId } from "../utils/validate.js";
import { User } from "../models/User.js";

/* =========================================================
   HELPERS
========================================================= */

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();

  return token || null;
}

function userFromToken(token) {
  const payload = verifyAccessToken(token);

  const userId = payload?.id || payload?.userId || payload?._id;

  if (!userId) return null;

  return {
    id: String(userId),
    role: payload.role,
    email: payload.email,
    name: payload.name,
  };
}

function attachGuest(req) {
  const guestId = validGuestId(req.headers["x-guest-id"]);

  if (guestId) {
    req.guestId = guestId;
  }
}

/* =========================================================
   REQUIRE AUTH
========================================================= */

export function requireAuth(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
      code: "NO_ACCESS_TOKEN",
    });
  }

  try {
    const user = userFromToken(token);

    if (!user) {
      return res.status(401).json({
        error: "Invalid token payload",
        code: "INVALID_TOKEN_PAYLOAD",
      });
    }

    req.user = user;
    attachGuest(req);

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
      code: "ACCESS_TOKEN_EXPIRED",
    });
  }
}

/* =========================================================
   OPTIONAL AUTH
========================================================= */

export function optionalAuth(req, res, next) {
  const token = getBearerToken(req);

  if (token) {
    try {
      req.user = userFromToken(token) || undefined;
    } catch {
      req.user = undefined;
    }
  }

  attachGuest(req);

  next();
}

/* ========================================================
   REQUIRE ADMIN
   Re-checks the role in the database: a role in an old token is not enough
   (demoted / suspended admins lose access immediately).
========================================================= */

/** True only for an existing, active admin account (checked in the database). */
export async function isActiveAdmin(userId) {
  if (!userId) return false;

  const user = await User.findById(userId).select("role status").lean();

  return Boolean(user && user.role === "admin" && user.status === "active");
}

export async function requireAdmin(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({
      error: "Unauthorized",
      code: "AUTH_REQUIRED",
    });
  }

  try {
    if (!(await isActiveAdmin(req.user.id))) {
      return res.status(403).json({
        error: "Forbidden",
        code: "ADMIN_REQUIRED",
      });
    }

    req.user.role = "admin";

    next();
  } catch {
    return res.status(403).json({
      error: "Forbidden",
      code: "ADMIN_REQUIRED",
    });
  }
}
