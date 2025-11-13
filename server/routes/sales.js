import express from 'express';
import Sale from '../models/Sale.js';

const router = express.Router();


// Get all sales, filter by customerId, vendor, date, session
// Get all sales, filter by customerId, vendor, date, session, and return total
router.get('/', async (req, res) => {
  const { customer, date, period, startDate, endDate } = req.query;
  let query = {};
  if (req.query.vendor) query.vendor = req.query.vendor;
  if (customer) query.customer = customer;

  if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.date = { $gte: startOfDay, $lte: endOfDay };
  } else if (period) {
    const now = new Date();
    let start, end;
    switch (period) {
      case 'daily':
        start = new Date(now);
        start.setHours(0,0,0,0);
        end = new Date(now);
        end.setHours(23,59,59,999);
        break;
      case 'weekly':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0,0,0,0);
        end = new Date(now);
        end.setDate(start.getDate() + 6);
        end.setHours(23,59,59,999);
        break;
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23,59,59,999);
        break;
      case 'yearly':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        end.setHours(23,59,59,999);
        break;
      default:
        start = null;
        end = null;
    }
    if (start && end) {
      query.date = { $gte: start, $lte: end };
    }
  }
  const sales = await Sale.find(query).populate('productId');
  // Calculate total sales for cost management
  const total = sales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
  res.json({ sales, total });
});


// Create a new sale (with session)
router.post('/', async (req, res) => {
  try {
    const { productId, customer, quantity, total, date, status } = req.body;
    if (!productId || !customer || !quantity || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const sale = new Sale({ productId, customer, quantity, total, date: date || new Date(), status: status || 'unpaid', vendor: req.body.vendor || null });
    await sale.save();
    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a sale
router.put('/:id', async (req, res) => {
  const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(sale);
});

// Delete a sale
router.delete('/:id', async (req, res) => {
  await Sale.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

export default router;
