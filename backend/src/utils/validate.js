// utils/validate.js
//
// Small input guards shared by every route. The API is used by both the web
// site and the mobile app, so validation lives here (server side), never in a
// client.

import mongoose from "mongoose";

/** Plain string or null. Objects/arrays (e.g. {"$ne": null}) are rejected. */
export const str = (value, maxLength = 500) => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > maxLength) return null;

  return trimmed;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Normalised (lower-case) email or null. User.email is stored lower-case. */
export const email = (value) => {
  const s = str(value, 254);

  if (!s) return null;

  const lower = s.toLowerCase();

  return EMAIL_RE.test(lower) ? lower : null;
};

export const isObjectId = (value) =>
  typeof value === "string" && mongoose.isValidObjectId(value) && /^[a-f\d]{24}$/i.test(value);

export const MAX_LINE_QUANTITY = 10;

/** Whole number 1..max, or null. Rejects 0, negatives, fractions, NaN, huge. */
export const quantity = (value, max = MAX_LINE_QUANTITY) => {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;

  if (!Number.isInteger(n) || n < 1 || n > max) return null;

  return n;
};

/** Escape user text before using it inside a RegExp / $regex. */
export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Safe search text: string, capped length, regex-escaped. "" when invalid. */
export const searchText = (value, maxLength = 64) => {
  const s = typeof value === "string" ? value.trim().slice(0, maxLength) : "";

  return s ? escapeRegex(s) : "";
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Guest ids identify guest carts/wishlists/orders, so they must be
 * unguessable. New clients send a UUID. Older app/web builds sent other random
 * strings; accept those only if long enough and plain alphanumeric.
 */
export const guestId = (value) => {
  if (typeof value !== "string") return null;

  const s = value.trim();

  if (UUID_RE.test(s)) return s.toLowerCase();

  if (/^[a-z0-9_-]{16,64}$/i.test(s) && !["undefined", "null"].includes(s)) return s;

  return null;
};
