import express from 'express';
import Vendor from '../models/Vendor.js';
import Customer from '../models/Customer.js';
import Milk from '../models/Milk.js';
import Sale from '../models/Sale.js';

const router = express.Router();

// Get all vendors
router.get('/vendors', async (req, res) => {
  const vendors = await Vendor.find();
  res.json(vendors);
});

// Get all customers
router.get('/customers', async (req, res) => {
  const customers = await Customer.find();
  res.json(customers);
});

// Get milk rates per vendor
router.get('/milk-rates', async (req, res) => {
  const milk = await Milk.find().populate('supplier');
  const rates = milk.map(m => ({
    vendor: m.supplier?.name || m.supplier,
    vendorId: m.supplier?._id || m.supplier,
    milkId: m._id,
    price: m.price,
    name: m.name
  }));
  res.json(rates);
});

// Get customer payment status (total paid for each customer)
router.get('/customer-payments', async (req, res) => {
  const sales = await Sale.find().populate('customer');
  const payments = {};
  for (const sale of sales) {
    const cid = sale.customer?._id?.toString();
    if (!cid) continue;
    if (!payments[cid]) payments[cid] = { customer: sale.customer, totalPaid: 0 };
    payments[cid].totalPaid += sale.total;
  }
  res.json(Object.values(payments));
});

export default router;
