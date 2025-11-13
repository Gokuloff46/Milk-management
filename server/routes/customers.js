import express from 'express';
import Customer from '../models/Customer.js';
import Milk from '../models/Milk.js'; // Import Milk model
import crypto from 'crypto';
import { sendSms } from '../utils/smsProvider.js';
import { signToken } from '../utils/jwt.js';
import mongoose from 'mongoose'; // Import mongoose

const router = express.Router();

function genCode(prefix = 'X', length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${out}`;
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

// Add a new customer (for VendorDashboard)
router.post('/', async (req, res) => {
  console.log('Received body:', req.body);
  try {
    const { name, phone, address, date, vendor } = req.body;
    if (!name || !phone || !address) {
      console.error('Missing required fields:', { name, phone, address });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const body = { name, phone, address, date, vendor: vendor || null };
    if (!body.customerCode) body.customerCode = genCode('CUS');
    const customer = new Customer(body);
    await customer.save();
    console.log('Customer saved:', customer);
    res.status(201).json(customer);
  } catch (err) {
    console.error('Error saving customer:', err);
    res.status(400).json({ error: err.message, details: err });
  }
});

// Update a customer by ID


// Register a new customer (optionally link to vendor)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, address, phone, vendor, pin } = req.body;
    const body = { name, email, address, phone, vendor: vendor || null };
    if (pin) body.pinHash = hash(pin);
    const customer = new Customer(body);
    if (!customer.customerCode) customer.customerCode = genCode('CUS');
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login endpoint kept for legacy email/password only. Mobile/PIN login is deprecated in favor of OTP.
router.post('/login', async (req, res) => {
  const { email, password, mobile, pin } = req.body;
  try {
    // If client is attempting mobile+pin, return an informative error directing to OTP flow
    if (mobile || pin) {
      return res.status(400).json({ error: 'Mobile/PIN login is deprecated. Use /send-otp and /verify-otp for mobile authentication.' });
    }
    if (email && password) {
      const customer = await Customer.findOne({ email, password });
      if (!customer) return res.status(401).json({ error: 'Invalid credentials' });
      const token = signToken({ id: customer._id, phone: customer.phone });
      return res.json({ customer, token });
    }
    return res.status(400).json({ error: 'Missing credentials' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Send OTP to mobile (demo mode: returns otp in response when SMS provider not configured)
router.post('/send-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Missing mobile' });
  try {
    let customer = await Customer.findOne({ phone: mobile });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not registered' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hash(otp);
    customer.otpHash = otpHash;
    customer.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await customer.save();
    // Send SMS via provider
    const message = `Your verification code is ${otp}`;
    const smsRes = await sendSms(mobile, message);
    if (!smsRes.success) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }
    // For local/demo mode expose the OTP when OTP_DEMO=true
    const allowDemo = process.env.OTP_DEMO === 'true' || process.env.OTP_DEMO === '1';
    res.json({ ok: true, ...(allowDemo ? { demoOtp: otp } : {}) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) return res.status(400).json({ error: 'Missing mobile or otp' });
  try {
    const customer = await Customer.findOne({ phone: mobile }).populate('vendor');
    if (!customer || !customer.otpHash || !customer.otpExpiry) return res.status(401).json({ error: 'Invalid or expired otp' });
    if (customer.otpExpiry < new Date()) return res.status(401).json({ error: 'OTP expired' });
    if (customer.otpHash !== hash(otp)) return res.status(401).json({ error: 'Invalid otp' });
    console.log('Populated customer:', customer);
    console.log('Vendor object:', customer.vendor);
    customer.verified = true;
    customer.otpHash = null;
    customer.otpExpiry = null;
    await customer.save();
    const token = signToken({ id: customer._id, phone: customer.phone });
    const vendorId = customer.vendor?._id || null; // Include vendorId in response
    return res.json({ customer: { ...customer.toObject(), vendorId }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all customers (admin only, include vendor info)
router.get('/', async (req, res) => {
  const customers = await Customer.find().populate('vendor');
  res.json(customers);
});
// Update a customer by ID
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Remove a customer by ID
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove customer' });
  }
});

// Deactivate a customer account
router.post('/:id/deactivate', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    customer.active = false;
    await customer.save();
    res.json({ message: 'Customer account deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate customer account' });
  }
});

// Get milk summary for a customer
// Add detailed logging to debug the milk-summary endpoint
router.get('/:id/milk-summary', async (req, res) => {
  try {
    const customerId = req.params.id;
    console.log('Fetching milk summary for customer ID:', customerId);

    // Convert customerId to ObjectId
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      console.error('Invalid customer ID format:', customerId);
      return res.status(400).json({ error: 'Invalid customer ID format' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      console.error('Customer not found for ID:', customerId);
      return res.status(404).json({ error: 'Customer not found' });
    }

    const milkEntries = await Milk.find({ customer: customerId });
    console.log('Milk entries found:', milkEntries);

    const totalLiters = milkEntries.reduce((sum, entry) => sum + entry.liter, 0);
    const totalCost = milkEntries.reduce((sum, entry) => sum + entry.price, 0);

    res.json({ totalLiters, totalCost });
  } catch (err) {
    console.error('Error in milk-summary endpoint:', err);
    res.status(500).json({ error: 'Failed to fetch milk summary' });
  }
});

// Ensure the date object is valid
const isSameMonth = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
};

export default router;
