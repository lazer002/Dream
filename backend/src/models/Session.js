// models/Session.js
//
// One document per login (device/browser). The refresh token carries the
// session id (`sid`); refresh rotates it and logout revokes it, so a stolen or
// logged-out refresh token stops working. Used by both web (cookie) and app
// (token in body).

import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    sid: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    client: { type: String, enum: ["web", "mobile"], default: "web" },
    userAgent: { type: String, default: "" },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: String, default: null },
  },
  { timestamps: true },
);

// Mongo removes expired sessions automatically.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model("Session", sessionSchema);
