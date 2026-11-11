// utils/jwt.js

import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL = "60m";
export const REFRESH_TOKEN_TTL_DAYS = 30;

// No fallbacks: a missing secret would let anyone sign admin tokens with a
// well-known default. Refuse to start instead.
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

for (const [name, value] of [
  ["JWT_SECRET", JWT_SECRET],
  ["JWT_REFRESH_SECRET", JWT_REFRESH_SECRET],
]) {
  if (!value || value.length < 16) {
    throw new Error(`${name} must be set (at least 16 characters, 32+ recommended)`);
  }

  if (value.length < 32) {
    console.warn(`[security] ${name} is shorter than 32 characters; rotate it to a long random value`);
  }
}

if (JWT_SECRET === JWT_REFRESH_SECRET) {
  throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be different");
}

const VERIFY_OPTIONS = { algorithms: ["HS256"] };

export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    algorithm: "HS256",
    expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET, VERIFY_OPTIONS);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET, VERIFY_OPTIONS);
}
