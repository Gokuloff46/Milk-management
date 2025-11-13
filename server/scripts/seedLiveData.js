import mongoose from 'mongoose';
import Milk from '../models/Milk.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/milk_management';

async function seedLiveData() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const vendorId = '68ad546fb8a2e43d5f64a7c5';
  const customerId = '68b53f360751847371aa400e';

  const liveEntries = [
    {
      vendor: vendorId,
      customer: customerId,
      session: 'morning',
      liter: 2,
      price: 100,
      date: new Date('2025-09-24'),
    },
    {
      vendor: vendorId,
      customer: customerId,
      session: 'evening',
      liter: 1.5,
      price: 75,
      date: new Date('2025-09-24'),
    },
  ];

  const result = await Milk.insertMany(liveEntries);
  console.log('Live data seeded:', result);

  mongoose.disconnect();
}

seedLiveData().catch(err => {
  console.error('Error seeding live data:', err);
  mongoose.disconnect();
});