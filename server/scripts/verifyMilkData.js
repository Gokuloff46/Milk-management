import mongoose from 'mongoose';
import Milk from '../models/Milk.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/milk_management';

async function verifyMilkData() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const vendorId = '68ad546fb8a2e43d5f64a7c5';
  const customerId = '68b53f360751847371aa400e';

  const entries = await Milk.find({ vendor: vendorId, customer: customerId });
  console.log('Milk entries for vendor and customer:', entries);

  mongoose.disconnect();
}

verifyMilkData().catch(err => {
  console.error('Error verifying milk data:', err);
  mongoose.disconnect();
});