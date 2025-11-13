import express from 'express';
import Product from '../models/Product.js';
const router = express.Router();

// Create a new product
router.post('/', async (req, res) => {
  try {
    const { name, capacity, unit, price } = req.body;
    if (!name || !capacity || !unit || !price) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const product = new Product({ name, capacity, unit, price, vendor: req.body.vendor || null });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.vendor) query.vendor = req.query.vendor;
    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a product
router.put('/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
