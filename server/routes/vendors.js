import express from 'express';
import Vendor from '../models/Vendor.js';
import adminAuth from '../middleware/adminAuth.js';
import Milk from '../models/Milk.js';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import mongoose from 'mongoose';
import customerAuth from '../middleware/customerAuth.js';

const router = express.Router();

// Simple code generator helper
function genCode(prefix = 'X', length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${out}`;
}

// Get vendor by ID (for session validation)
router.get('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all milk products for a vendor
router.get('/:vendorId/milk', async (req, res) => {
  try {
    // Support legacy documents that use either `supplier` or `vendor` to reference the vendor id
    const vid = req.params.vendorId;
    const milkList = await Milk.find({ $or: [{ supplier: vid }, { vendor: vid }] });
    res.json(milkList);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch milk products', details: err.message });
  }
});

// Get all sales for a vendor's customers
router.get('/:vendorId/customer-payments', async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const customers = await Customer.find({ vendor: vendorId });
    // sales historically stored customer as a name string; build both name list and id list
    const customerNames = customers.map(c => c.name);
    // Find sales either explicitly associated by vendor field
    // OR (legacy) sales where customer is stored as a name string and the sale has no vendor set.
    // Restricting the name-match to records with no vendor prevents returning sales that belong to other vendors
    // simply because the customer name collides.
    const sales = await Sale.find({
      $or: [
        { vendor: vendorId },
        { $and: [ { vendor: { $exists: false } }, { customer: { $in: customerNames } } ] }
      ]
    }).populate('productId');
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer payments' });
  }
});

// Update payment status for a sale
router.put('/sales/:saleId/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['paid', 'unpaid'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const sale = await Sale.findByIdAndUpdate(req.params.saleId, { status }, { new: true });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Get monthly report for a vendor (total liters and revenue per month)
router.get('/:vendorId/monthly-report', async (req, res) => {
  try {
    const sales = await Sale.find().populate('milk');
    // Filter sales for this vendor
    const vendorSales = sales.filter(sale => sale.milk && sale.milk.supplier?.toString() === req.params.vendorId);
    // Group by month
    const report = {};
    vendorSales.forEach(sale => {
      const date = new Date(sale.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!report[month]) report[month] = { month, totalLiters: 0, totalRevenue: 0 };
      report[month].totalLiters += sale.quantity;
      report[month].totalRevenue += sale.total;
    });
    res.json(Object.values(report));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch monthly report' });
  }
});

// Admin declines (removes) vendor
router.delete('/:id/decline', async (req, res) => {
  const vendor = await Vendor.findByIdAndDelete(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
  res.json({ message: 'Vendor declined and removed' });
});

// Get all vendors (for admin dashboard)
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register a new vendor
// Register a new vendor (status: pending)
router.post('/register', async (req, res) => {
  try {
    const body = { ...req.body, status: 'pending' };
    if (!body.vendorCode) body.vendorCode = genCode('VND');
    const vendor = new Vendor(body);
    await vendor.save();
    res.status(201).json({ message: 'Registration successful. Awaiting admin approval.', vendor });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login (simple, no JWT for now)
// Vendor login (only if approved)
router.post('/login', async (req, res) => {
  let { email, password } = req.body;
  email = email ? email.trim().toLowerCase() : '';
  password = password ? password.trim() : '';
  console.log('Vendor login attempt:', { email, password });
  const vendor = await Vendor.findOne({ email });
  if (!vendor) {
    console.log('Vendor not found for email:', email);
    return res.status(401).json({ error: 'Invalid credentials: email not found' });
  }
  if (vendor.password !== password) {
    console.log('Vendor password mismatch:', { email, attempted: password, actual: vendor.password });
    return res.status(401).json({ error: 'Invalid credentials: password incorrect' });
  }
  if (vendor.status !== 'approved') {
    console.log('Vendor not approved:', { email, status: vendor.status });
    return res.status(403).json({ error: 'Your account is not approved yet.', status: vendor.status });
  }
  res.json(vendor);
});

// Admin approves vendor (idempotent)
router.put('/:id/approve', adminAuth, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    if (vendor.status === 'approved') {
      return res.json({ message: 'Vendor already approved', vendor });
    }
    vendor.status = 'approved';
    await vendor.save();
    res.json({ message: 'Vendor approved', vendor });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve vendor', details: err.message });
  }
});

// Deactivate a vendor account
router.post('/:id/deactivate', adminAuth, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    vendor.status = 'deactivated';
    await vendor.save();
    res.json({ message: 'Vendor account deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate vendor account' });
  }
});

// Reset a vendor's password
router.post('/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    vendor.password = password;
    await vendor.save();
    res.json({ message: 'Vendor password reset successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset vendor password' });
  }
});

// Get all customers for a vendor
router.get('/:vendorId/customers', async (req, res) => {
  try {
    const customers = await Customer.find({ vendor: req.params.vendorId });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers', details: err.message });
  }
});

// Get recent milk entries for a specific customer (vendor-scoped)
router.get('/:vendorId/customers/:customerId/entries', customerAuth, async (req, res) => {
  try {
    const { vendorId, customerId } = req.params;
    console.log('Fetching entries for vendor:', vendorId, 'customer:', customerId); // Debug logging

    // Check if vendor exists
    const vendorExists = await Vendor.exists({ _id: vendorId });
    if (!vendorExists) return res.status(404).json({ error: 'Vendor not found' });

    if (!req.customer || req.customer.id !== customerId) return res.status(403).json({ error: 'Forbidden' });
    const limit = Number(req.query.limit) || 5;

  // Find milk entries that belong to this vendor (match either vendor or supplier fields) and the customer
  const entries = await Milk.find({ $and: [ { $or: [{ vendor: vendorId }, { supplier: vendorId }] }, { customer: customerId } ] }).sort({ date: -1 }).limit(limit).lean();
    console.log('Entries fetched:', entries); // Debug logging
    if (!Array.isArray(entries)) throw new Error('Entries query did not return an array');
    res.json(entries);
  } catch (err) {
    console.error('Error fetching entries:', err); // Debug logging
    res.status(500).json({ error: 'Failed to fetch entries', details: err.message });
  }
});

// Get current balance for a customer under a vendor
router.get('/:vendorId/customers/:customerId/balance', customerAuth, async (req, res) => {
  try {
    const { vendorId, customerId } = req.params;
    console.log('Fetching balance for vendor:', vendorId, 'customer:', customerId); // Debug logging
    if (!req.customer || req.customer.id !== customerId) return res.status(403).json({ error: 'Forbidden' });
    const unpaidMilk = await Milk.aggregate([
      { $match: { vendor: mongoose.Types.ObjectId(vendorId), customer: mongoose.Types.ObjectId(customerId), paymentStatus: 'unpaid' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    console.log('Unpaid milk entries:', unpaidMilk); // Debug logging
    const unpaidSales = await Sale.aggregate([
      { $match: { vendor: mongoose.Types.ObjectId(vendorId), customer: mongoose.Types.ObjectId(customerId), status: 'unpaid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    console.log('Unpaid sales entries:', unpaidSales); // Debug logging
    const milkTotal = unpaidMilk[0]?.total || 0;
    const salesTotal = unpaidSales[0]?.total || 0;
    const balance = milkTotal + salesTotal;
    if (isNaN(balance)) throw new Error('Balance computation resulted in NaN');
    res.json({ balance });
  } catch (err) {
    console.error('Error computing balance:', err); // Debug logging
    res.status(500).json({ error: 'Failed to compute balance', details: err.message });
  }
});

// Get vendor default milk price
router.get('/:vendorId/price', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ defaultMilkPrice: vendor.defaultMilkPrice || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendor price' });
  }
});

// Get vendor milk price
router.get('/:vendorId/milk-price', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ price: vendor.defaultMilkPrice || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendor milk price' });
  }
});

// Get vendor daily milk total
router.get('/:vendorId/milk-daily-total', async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const milk = await Milk.find({
      vendor: vendorId,
      date: { $gte: today, $lt: tomorrow }
    });

    const total = milk.reduce((acc, item) => acc + item.liter, 0);
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily milk total' });
  }
});

// Get vendor daily milk entries
router.get('/:vendorId/milk/today', async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const milk = await Milk.find({
      vendor: vendorId,
      date: { $gte: today, $lt: tomorrow }
    });

    res.json(milk);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily milk entries' });
  }
});

// Get vendor total cost
router.get('/:vendorId/total-cost', async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const milk = await Milk.find({ vendor: vendorId });
    const total = milk.reduce((acc, item) => acc + item.price, 0);
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch total cost' });
  }
});

// Get vendor customer count
router.get('/:vendorId/customers/count', async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const count = await Customer.countDocuments({ vendor: vendorId });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer count' });
  }
});

// Update vendor default milk price
router.put('/:vendorId/price', async (req, res) => {
  try {
    const { defaultMilkPrice } = req.body;
    if (defaultMilkPrice !== undefined && isNaN(Number(defaultMilkPrice))) return res.status(400).json({ error: 'Invalid price' });
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    vendor.defaultMilkPrice = defaultMilkPrice === undefined ? vendor.defaultMilkPrice : Number(defaultMilkPrice);
    await vendor.save();
    res.json({ defaultMilkPrice: vendor.defaultMilkPrice });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vendor price' });
  }
});

// Set price per liter for a milk product
router.put('/:vendorId/milk/:milkId/price', async (req, res) => {
  const { price, unit } = req.body;
  const updateFields = { price };
  if (unit) updateFields.unit = unit;
  const milk = await Milk.findOneAndUpdate({ _id: req.params.milkId, supplier: req.params.vendorId }, updateFields, { new: true });
  if (!milk) return res.status(404).json({ error: 'Milk not found or not owned by vendor' });
  res.json(milk);
});

// Add milk product for a vendor
router.post('/:vendorId/milk', async (req, res) => {
  try {
    const { name, quantity, price, unit } = req.body;
    const milk = new Milk({
      name,
      quantity,
      price,
      unit: unit || 'liter',
      supplier: req.params.vendorId
    });
    await milk.save();
    res.status(201).json(milk);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add milk product', details: err.message });
  }
});

// NOTE: single approve endpoint is defined earlier as router.put('/:id/approve')
// The duplicate endpoint that previously set `approved: true` has been removed to
// avoid inconsistent boolean/string fields. Approval should always set
// vendor.status = 'approved' using the `/api/vendors/:id/approve` endpoint above.

// Delete vendor
router.delete('/:vendorId', adminAuth, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    // Cascade deletion to related milk entries
    const milkDeletionResult = await Milk.deleteMany({ vendor: req.params.vendorId });
    console.log('Milk entries deleted:', milkDeletionResult);

    res.json({ message: 'Vendor and related data deleted successfully' });
  } catch (err) {
    console.error('Error deleting vendor and related data:', err);
    res.status(500).json({ error: 'Failed to delete vendor', details: err.message });
  }
});

// Monthly report for a customer under a vendor
router.get('/:vendorId/customers/:customerId/report', customerAuth, async (req, res) => {
  try {
    const { vendorId, customerId } = req.params;
    console.log('Fetching milk report for vendor:', vendorId, 'customer:', customerId); // Debug logging

    // Check if vendor exists
    const vendorExists = await Vendor.exists({ _id: vendorId });
    if (!vendorExists) return res.status(404).json({ error: 'Vendor not found' });

    if (!req.customer || req.customer.id !== customerId) return res.status(403).json({ error: 'Forbidden' });

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    console.log('Date range:', { startOfMonth, endOfMonth }); // Debug logging

    // Sum liters for the report (previously summed price which produced very large "liters" values)
    const milkEntries = await Milk.aggregate([
      { $match: { vendor: new mongoose.Types.ObjectId(vendorId), customer: new mongoose.Types.ObjectId(customerId), date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$liter' }, count: { $sum: 1 } } }
    ]);
    console.log('Milk entries aggregation result:', milkEntries); // Debug logging

    const milkTotal = milkEntries[0]?.total || 0;
    const milkDays = milkEntries[0]?.count || 0;

    res.json({ milkTotal, milkDays });
  } catch (err) {
    console.error('Error fetching milk report:', err); // Debug logging
    res.status(500).json({ error: 'Failed to fetch milk report', details: err.message });
  }
});

export default router;
