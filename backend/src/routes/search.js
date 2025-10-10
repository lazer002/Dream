import express from "express";
import { Product } from "../models/Product.js";

const router = express.Router();


router.get("/products", async (req, res) => {
  try {
    const query = req.query.q?.trim();
    if (!query) return res.status(400).json({ error: "Missing search query" });

    const regex = new RegExp(query, "i");

    const products = await Product.find({
      published: true,
      $or: [{ title: regex }, { description: regex }, { category: regex }],
    })
      .limit(20)
      .lean();

    res.json(products);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/filter", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, brand } = req.query;

    const filter = { published: true };

    if (category) filter.category = category;
    if (brand) filter.brand = brand; // You need to add a brand field in your schema if not present
    if (minPrice || maxPrice) filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);

    const products = await Product.find(filter).limit(50).lean();

    if (!products.length) {
      return res.status(404).json({ error: "No matching products found" });
    }

    res.json(products);
  } catch (err) {
    console.error("Filter error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
