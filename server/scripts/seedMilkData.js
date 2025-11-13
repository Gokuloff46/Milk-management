import mongoose from 'mongoose';
import Milk from '../models/Milk.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/milk_management';

async function seedMilkData() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const vendorId = '68ad546fb8a2e43d5f64a7c5';
  const customerId = '68b53f360751847371aa400e';

  const milkEntries = [
    {
      paymentStatus: 'paid',
      customer: customerId,
      vendor: vendorId,
      session: 'morning',
      liter: 5,
      price: 250,
      date: new Date('2025-09-01')
    },
    {
      paymentStatus: 'paid',
      customer: customerId,
      vendor: vendorId,
      session: 'evening',
      liter: 3,
      price: 150,
      date: new Date('2025-09-02')
    }
  ];

  await Milk.insertMany(milkEntries);
  console.log('Milk data seeded successfully');

  mongoose.disconnect();
}

seedMilkData().catch(err => {
  console.error('Error seeding milk data:', err);
  mongoose.disconnect();
});