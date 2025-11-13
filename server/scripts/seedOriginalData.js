import mongoose from 'mongoose';
import Milk from '../models/Milk.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/milk_management';

async function seedOriginalData() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const vendorId = '68ad546fb8a2e43d5f64a7c5';
  const customerId = '68b53f360751847371aa400e';

  const originalMilkEntries = [
    {
      paymentStatus: 'paid',
      customer: customerId,
      vendor: vendorId,
      session: 'morning',
      liter: 2,
      price: 100,
      date: new Date('2025-09-10')
    },
    {
      paymentStatus: 'paid',
      customer: customerId,
      vendor: vendorId,
      session: 'evening',
      liter: 1.5,
      price: 75,
      date: new Date('2025-09-15')
    }
  ];

  await Milk.insertMany(originalMilkEntries);
  console.log('Original milk data seeded successfully');

  mongoose.disconnect();
}

seedOriginalData().catch(err => {
  console.error('Error seeding original milk data:', err);
  mongoose.disconnect();
});