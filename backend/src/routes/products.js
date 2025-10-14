import express from 'express'
import { Product } from '../models/Product.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { Category } from '../models/Category.js';

const router = express.Router()

router.get("/", async (req, res) => {
  try {
    const { category, q, limit = 20, page = 1 } = req.query;
    const filter = { published: true };
    // Category filter by name or skip if 'All'
    if (category && category !== 'All') {
      const cat = await Category.findOne({ name: category });
      if (cat) filter.category = cat._id;
    }
    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name') // only return name of category
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ items: products, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/:id', async (req, res) => {
  console.log(req.body)
  const product = await Product.findById(req.params.id)
  if (!product || !product.published) return res.status(404).json({ error: 'Not found' })
  res.json(product)
})

// Admin CRUD
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const product = await Product.create(req.body)
  res.status(201).json(product)
})

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!product) return res.status(404).json({ error: 'Not found' })
  res.json(product)
})

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const regex = new RegExp(q, "i");

    const products = await Product.find({
      published: true,
      $or: [
        { title: regex },
        { category: regex },
        { description: regex },
      ],
    })
      .select("title price images category sku") // return only essential fields
      .limit(20)
      .lean();

    if (products.length === 0) {
      return res.status(404).json({ message: "No matching products found" });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Search API error:", error);
    res.status(500).json({ error: "Server error" });
  }
});





export default router


