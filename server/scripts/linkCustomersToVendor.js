import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Vendor from '../models/Vendor.js';

async function linkCustomersToDefaultVendor() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/milk_management');
  console.log('Connected to MongoDB');

  const defaultVendor = await Vendor.findOne();
  if (!defaultVendor) {
    console.error('No vendor found to link customers');
    return;
  }

  const customersWithoutVendor = await Customer.find({ vendor: null });
  for (const customer of customersWithoutVendor) {
    customer.vendor = defaultVendor._id;
    await customer.save();
    console.log(`Linked customer ${customer._id} to vendor ${defaultVendor._id}`);
  }

  console.log('Customer linking complete');
  mongoose.disconnect();
}

linkCustomersToDefaultVendor().catch(err => {
  console.error('Error during customer linking:', err);
  mongoose.disconnect();
});