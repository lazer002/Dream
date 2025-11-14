// routes/wishlist.js
import express from "express";
import {User} from "../models/User.js"; // your user model
import { requireAuth } from "../middleware/auth.js"; // sets req.userId or req.user

const router = express.Router();

// GET /api/wishlist
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const user = await User.findById(userId).select("wishlist").populate("wishlist"); // optional populate if wishlist holds ObjectId refs
    return res.json({ items: user?.wishlist ?? [] });
  } catch (err) {
    console.error("GET /wishlist error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/wishlist/add { productId }
router.post("/add", requireAuth, async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: "productId required" });

  try {
    // $addToSet ensures dedupe
    const updated = await User.findByIdAndUpdate(
      req.userId || req.user?.id,
      { $addToSet: { wishlist: productId } },
      { new: true, select: "wishlist" }
    );

    return res.json({ items: updated?.wishlist ?? [] });
  } catch (err) {
    console.error("POST /wishlist/add error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/wishlist/remove { productId }
router.post("/remove", requireAuth, async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: "productId required" });

  try {
    const updated = await User.findByIdAndUpdate(
      req.userId || req.user?.id,
      { $pull: { wishlist: productId } },
      { new: true, select: "wishlist" }
    );

    return res.json({ items: updated?.wishlist ?? [] });
  } catch (err) {
    console.error("POST /wishlist/remove error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/wishlist/sync { items: [productId,...] }
// Merges guest items into user's wishlist (union)
router.post("/sync", requireAuth, async (req, res) => {
  const guestItems = Array.isArray(req.body.items) ? req.body.items : [];

  try {
    const userId = req.userId || req.user?.id;

    // Fetch current wishlist
    const user = await User.findById(userId).select("wishlist");
    const current = (user?.wishlist || []).map(String);

    // Merge -> union
    const merged = Array.from(new Set([...current, ...guestItems.map(String)]));

    // Save (replace whole wishlist atomically)
    user.wishlist = merged;
    await user.save();

    return res.json({ items: user.wishlist });
  } catch (err) {
    console.error("POST /wishlist/sync error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
