import express from 'express'
const router = express.Router()
import {Category}  from '../models/Category.js'
import {User}  from '../models/User.js'
import Razorpay from 'razorpay'
import { CreateOrder } from '../models/CreateOrder.js'
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({})
        res.json({ categories })
    } catch (error) {
        console.error('Error fetching categories:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

// GET /api/wishlist/:userId
router.get('/wishlist/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).select('wishlist');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ wishlist: user.wishlist });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/wishlist/add
router.post('/wishlist/add', async (req, res) => {
  try {
    const { productId,userId } = req.body;

    if (!productId) return res.status(400).json({ error: 'Product ID is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }

    res.json({ wishlist: user.wishlist });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// POST /api/wishlist/remove
router.post('/wishlist/remove', async (req, res) => {
  try {
    const { productId,userId } = req.body;

    if (!productId) return res.status(400).json({ error: 'Product ID is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();

    res.json({ wishlist: user.wishlist });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
})

router.post('/create', async (req, res) => {
  try {
    const { email, shippingAddress, items, subtotal, shippingMethod, billingSame, saveInfo, discountCode } = req.body

    const shippingFee = 100
    const total = subtotal + shippingFee

    const razorpayOrder = await razorpay.orders.create({
      amount: total * 100, // in paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`
    })

    const order = await CreateOrder.create({
      email,
      shippingMethod,
      billingSame,
      shippingAddress,
      saveInfo,
      items: items.map(i => ({
        productId: i.productId,
        title: i.title,
        variant: i.variant,
        quantity: i.quantity,
        price: i.price,
        total: i.price * i.quantity
      })),
      subtotal,
      shippingFee,
      total,
      discountCode,
      payment: {
        razorpayOrderId: razorpayOrder.id,
        amount: total,
        currency: "INR",
        status: "pending"
      }
    })

    res.status(201).json({
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: total * 100,
      currency: "INR"
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})



export default router