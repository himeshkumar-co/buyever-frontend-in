const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'Access denied. No token provided.' });

  const token = authHeader.replace('Bearer ', '');
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ message: 'Access denied. Invalid token format.' });
  }

  try {
    const verified = jwt.verify(token, 'your_jwt_secret');
    req.user = verified;
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    res.status(400).json({ message: 'Invalid token: ' + err.message });
  }
};

// Create order
router.post('/', verifyToken, async (req, res) => {
  try {
    const { items, total } = req.body;
    const order = new Order({
      userId: req.user._id,
      items,
      total
    });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user orders
router.get('/', verifyToken, async (req, res) => {
  try {
    if (!req.user._id && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'User ID missing in token' });
    }

    const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all orders (for admin)
router.get('/admin/all', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
