import express from 'express'
import {Category}  from '../models/Category.js'
import { singleImage, sniffImage } from '../middleware/upload.js'
import { uploadLimiter } from '../middleware/rateLimit.js'
import crypto from 'crypto'
import { supabase } from '../config/supabase.js'
import dotenv from 'dotenv'
import { optionalAuth, requireAuth } from '../middleware/auth.js' // new middleware
import { Product } from '../models/Product.js'
import { Bundle } from "../models/Bundle.js";
dotenv.config()
const router = express.Router()

router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({})
        res.json({ categories })
    } catch (error) {
        console.error('Error fetching categories:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})


router.post("/upload/image", uploadLimiter, optionalAuth, singleImage("file"), async (req, res) => {
    try {
      const userId = req.user?.id || null;
      const guestId = req.guestId || null;

      // Must be a logged-in user or a guest of this app/site.
      if (!userId && !guestId) {
        return res.status(401).json({ error: "Login required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file" });
      }

      // Real type from the file contents, not the client's claim.
      const real = sniffImage(req.file.buffer);

      if (!real) {
        return res.status(400).json({ error: "Invalid file type" });
      }

  
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          error: "Invalid file type",
        });
      }

      // 🔥 size limit (1MB)
      if (req.file.size > 1 * 1024 * 1024) {
        return res.status(400).json({
          error: "File too large (max 1MB)",
        });
      }
      // Server-chosen name: owner folder + random id + real extension.
      const owner = userId ? `u-${userId}` : `g-${crypto.createHash("sha256").update(guestId).digest("hex").slice(0, 16)}`;
      const path = `profile/${owner}/${crypto.randomUUID()}.${real.ext}`;

      // 🔥 upload to supabase
      const { data, error } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET_PUBLIC)
        .upload(path, req.file.buffer, {
          contentType: real.mime,
          upsert: false,
        });

      if (error) {
        console.error("Upload storage error:", error.message);
        return res.status(500).json({ error: "Upload failed" });
      }

      // 🔥 get public url
      const { data: pub } = supabase.storage
        .from(process.env.SUPABASE_BUCKET_PUBLIC)
        .getPublicUrl(data.path);

      return res.json({
        success: true,
        url: pub.publicUrl,
        path: data.path,
      });
    } catch (e) {
      console.error("Upload error:", e.message);
      return res.status(500).json({ error: "Upload failed" });
    }
  }
);


// GET /api/products/:publicId/related

router.get(
  "/products/:publicId/related",
  optionalAuth,
  async (req, res) => {
    try {
      const product = await Product.findOne({
        publicId: req.params.publicId,
      })
        .select("_id category")
        .lean();

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const products = await Product.find({
        _id: { $ne: product._id },
        category: product.category,
        active: true,
        published: true,
      })
        .select(
          "publicId title slug price oldPrice discount images category isOutOfStock"
        )
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      res.json({
        success: true,
        products,
      });
    } catch (error) {
      console.error(
        "GET RELATED PRODUCTS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to fetch related products",
      });
    }
  }
);


// GET /api/bundles/:publicId/related

router.get(
  "/bundles/:publicId/related",
  optionalAuth,
  async (req, res) => {
    try {
      console.log('✌️publicId --->', req.params.publicId);
      const bundle = await Bundle.findOne({
        publicId: req.params.publicId,
      })
        .select("_id category")
        .lean();


      if (!bundle) {
        return res.status(404).json({
          success: false,
          message: "Bundle not found",
        });
      }

      const bundles = await Bundle.find({
        _id: { $ne: bundle._id },
        category: bundle.category,
        active: true,
        published: true,
      })
        .select(
          "publicId title slug price oldPrice discount mainImages category onSale isNewBundle isOutOfStock"
        )
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();

      res.json({
        success: true,
        bundles,
      });
    } catch (error) {
      console.error(
        "GET RELATED BUNDLES ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to fetch related bundles",
      });
    }
  }
);


export default router