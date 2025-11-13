import express from 'express';
import Supplier from '../models/Supplier.js';

const router = express.Router();

// Get all suppliers
router.get('/', async (req, res) => {
  const suppliers = await Supplier.find();
  res.json(suppliers);
});

// Create a new supplier
router.post('/', async (req, res) => {
  const supplier = new Supplier(req.body);
  await supplier.save();
  res.status(201).json(supplier);
});

// Update a supplier
router.put('/:id', async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(supplier);
});

// Delete a supplier
router.delete('/:id', async (req, res) => {
  await Supplier.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

export default router;
