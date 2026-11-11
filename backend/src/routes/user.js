import express from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Avatars may only point at our own storage (or Google profile photos).
const allowedAvatarHosts = () => {
  const hosts = ["lh3.googleusercontent.com"];

  try {
    if (process.env.SUPABASE_URL) hosts.push(new URL(process.env.SUPABASE_URL).host);
  } catch {
    // ignore bad env value
  }

  return hosts;
};

const isAllowedAvatar = (value) => {
  try {
    const url = new URL(value);

    return url.protocol === "https:" && allowedAvatarHosts().includes(url.host);
  } catch {
    return false;
  }
};
router.put("/update",requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const name = typeof req.body?.name === "string" ? req.body.name.slice(0, 100) : undefined;
    const phone = typeof req.body?.phone === "string" ? req.body.phone.trim().slice(0, 20) : undefined;
    const avatar = typeof req.body?.avatar === "string" ? req.body.avatar.trim().slice(0, 500) : undefined;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔥 VALIDATION
    if (name && name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name too short",
      });
    }

    if (phone && !/^\+?[0-9 ()-]{8,20}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    // 🔥 UPDATE FIELDS
    if (name) user.name = name.trim();
    if (phone) user.phone = phone;

    // 🔥 AVATAR (FROM SUPABASE URL)
    if (avatar) {
      if (!isAllowedAvatar(avatar)) {
        return res.status(400).json({
          success: false,
          message: "Invalid avatar URL",
        });
      }

      user.avatar = avatar;
    }

    user.lastLogin = new Date();

    await user.save();

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Update user error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
});


export default router;