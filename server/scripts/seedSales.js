import mongoose from 'mongoose';
import Sale from '../models/Sale.js';

// This script will add sample sales data for testing
async function seedSales() {
  await mongoose.connect('mongodb://localhost:27017/milk', { useNewUrlParser: true, useUnifiedTopology: true });

  const sampleSales = [
    {
      productId: '64e3b2f2c2a1a2b1c1d1e1f1', // Replace with a valid Product ObjectId from your DB
      customer: 'Customer A',
      quantity: 2,
      total: 100,
      date: new Date('2025-08-20'),
      status: 'paid'
    },
    {
      productId: '64e3b2f2c2a1a2b1c1d1e1f1',
      customer: 'Customer B',
      quantity: 1,
      total: 50,
      date: new Date('2025-08-22'),
      status: 'unpaid'
    },
    {
      productId: '64e3b2f2c2a1a2b1c1d1e1f1',
      customer: 'Customer C',
      quantity: 3,
      total: 150,
      date: new Date('2025-08-19'),
      status: 'paid'
    }
  ];

  await Sale.deleteMany({});
  await Sale.insertMany(sampleSales);
  console.log('Sample sales data seeded!');
  mongoose.disconnect();
}

seedSales();
