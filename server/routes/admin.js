import express from 'express';
import Admin from '../models/Admin.js';
import { signToken } from '../utils/jwt.js';
import Milk from '../models/Milk.js';
import bcrypt from 'bcrypt';
import Vendor from '../models/Vendor.js';
import Customer from '../models/Customer.js';

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  console.log('Admin login route accessed');
  try {
    const { username, password } = req.body || {};
    console.log('Admin login attempt:', { username, password }); // Added log
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
    const admin = await Admin.findOne({ username });
    console.log('Found admin user:', admin); // Added log
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    // Debugging logs
    console.log('Request password:', password);
    console.log('Stored hashed password:', admin.password);

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log('Password match result:', isMatch);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    // Issue a short-lived token (1 hour)
    const token = signToken({ id: String(admin._id), username: admin.username }, '1h');
    res.json({ token, username: admin.username });
  } catch (err) {
    console.error('Admin login error', err);
    res.status(500).json({ error: 'Server error during admin login', details: err.message });
  }
});

// Admin updates price for any milk product
router.put('/milk/:milkId/price', async (req, res) => {
  const { price } = req.body;
  const milk = await Milk.findByIdAndUpdate(req.params.milkId, { price }, { new: true });
  if (!milk) return res.status(404).json({ error: 'Milk not found' });
  res.json(milk);
});

// Deactivate vendor account
router.post('/vendors/:vendorId/deactivate', async (req, res) => {
  try {
    const { vendorId } = req.params;

    // Find the vendor by ID
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Update the vendor's status to 'deactivated'
    vendor.status = 'deactivated';
    await vendor.save();

    res.json({ message: 'Vendor deactivated successfully', vendor });
  } catch (error) {
    console.error('Error deactivating vendor:', error);
    res.status(500).json({ error: 'Server error during vendor deactivation', details: error.message });
  }
});

// Reset vendor password
router.post('/vendors/:vendorId/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Missing password' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const vendor = await Vendor.findByIdAndUpdate(req.params.vendorId, { password: hashedPassword }, { new: true });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ message: 'Vendor password reset successfully', vendor });
  } catch (err) {
    console.error('Error resetting vendor password:', err);
    res.status(500).json({ error: 'Failed to reset vendor password' });
  }
});

// Deactivate customer account
router.post('/customers/:customerId/deactivate', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.customerId, { active: false }, { new: true });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer account deactivated successfully', customer });
  } catch (err) {
    console.error('Error deactivating customer account:', err);
    res.status(500).json({ error: 'Failed to deactivate customer account' });
  }
});

// Reset customer password
router.post('/customers/:customerId/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Missing password' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = await Customer.findByIdAndUpdate(req.params.customerId, { password: hashedPassword }, { new: true });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer password reset successfully', customer });
  } catch (err) {
    console.error('Error resetting customer password:', err);
    res.status(500).json({ error: 'Failed to reset customer password' });
  }
});

export default router;
