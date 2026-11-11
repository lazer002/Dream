import express from 'express'
import mongoose from 'mongoose'
import { endAllSessions } from '../utils/session.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { User } from '../models/User.js'
import { Category } from '../models/Category.js'


const router = express.Router()

router.use(requireAuth, requireAdmin)

// List users
router.get('/', async (_req, res) => {
  try {
    const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 })
    res.json({ items: users })
  } catch (err) {
    console.error('Admin list users error:', err.message)
    res.status(500).json({ error: 'Failed to load users' })
  }
})

// This router is mounted at /api/admin, so '/:id' would also catch paths like
// /api/admin/products. Only handle real user ids; pass everything else on.
const userIdOnly = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : next('route')

// Update role / name
router.patch('/:id', userIdOnly, async (req, res) => {
  try {
    const { role, name } = req.body || {}
    const update = {}

    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' })
      if (String(req.params.id) === String(req.user.id) && role !== 'admin') {
        return res.status(400).json({ error: 'You cannot remove your own admin role' })
      }
      update.role = role
    }

    if (typeof name === 'string' && name.trim()) update.name = name.trim().slice(0, 100)

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, projection: { passwordHash: 0 } })
    if (!user) return res.status(404).json({ error: 'Not found' })

    // Role changed: old tokens must not keep the old role.
    if (update.role) await endAllSessions(user._id)

    res.json(user)
  } catch (err) {
    console.error('Admin update user error:', err.message)
    res.status(500).json({ error: 'Update failed' })
  }
})

// Delete user
router.delete('/:id', userIdOnly, async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ error: 'You cannot delete your own account here' })
    }

    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).json({ error: 'Not found' })

    await endAllSessions(user._id)

    res.json({ ok: true })
  } catch (err) {
    console.error('Admin delete user error:', err.message)
    res.status(500).json({ error: 'Delete failed' })
  }
})
router.post("/createCategory", async (req, res) => {
  try {
    const { name, slug, photo } = req.body; // accept photo URL
    const category = new Category({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      photo: photo || null,
    });
    await category.save();
    res.json({ success: true, category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all categories
router.get("/getCategory", async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update category
router.put("/category/:id", async (req, res) => {
  try {

    console.log('✌️req.params --->', req.params);
    const { id } = req.params;

    const { name, slug, photo } = req.body; // accept photo URL
    const updated = await Category.findByIdAndUpdate(
      id,
      { 
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        ...(photo && { photo }) // only update if provided
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Category not found" });
    res.json({ success: true, category: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete category
router.delete("/category/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Category not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});


export default router


