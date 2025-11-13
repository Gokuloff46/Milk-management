import mongoose from 'mongoose';
import Vendor from '../models/Vendor.js';
import Customer from '../models/Customer.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/milk_management';

async function genCode(prefix, length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${out}`;
}

async function backfillVendorCodes() {
  const vendors = await Vendor.find({ vendorCode: { $exists: false } });
  for (const vendor of vendors) {
    vendor.vendorCode = await genCode('VND');
    await vendor.save();
    console.log(`Updated vendor ${vendor._id} with code ${vendor.vendorCode}`);
  }
}

async function backfillCustomerCodes() {
  const customers = await Customer.find({ customerCode: { $exists: false } });
  for (const customer of customers) {
    customer.customerCode = await genCode('CUS');
    await customer.save();
    console.log(`Updated customer ${customer._id} with code ${customer.customerCode}`);
  }
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await backfillVendorCodes();
  await backfillCustomerCodes();

  console.log('Backfill complete');
  mongoose.disconnect();
}

main().catch(err => {
  console.error('Error during backfill:', err);
  mongoose.disconnect();
});