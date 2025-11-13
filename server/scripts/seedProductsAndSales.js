import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/milk_management');

  // Seed products
  const products = [
    { name: 'Coconut oil', capacity: 1, unit: 'liter', price: 250 },
    { name: 'Curd', capacity: 0.5, unit: 'kg', price: 40 },
    { name: 'Paneer', capacity: 0.25, unit: 'kg', price: 120 }
  ];
  await Product.deleteMany({});
  const createdProducts = await Product.insertMany(products);

  // Seed sales
  const sales = [
    {
      productId: createdProducts[0]._id,
      customer: 'Madhu',
      quantity: 0.5,
      total: 125,
      date: new Date('2025-08-22'),
      status: 'unpaid'
    },
    {
      productId: createdProducts[1]._id,
      customer: 'Madhu',
      quantity: 0.5,
      total: 20,
      date: new Date('2025-08-22'),
      status: 'unpaid'
    }
  ];
  await Sale.deleteMany({});
  await Sale.insertMany(sales);

  console.log('Demo products and sales seeded!');
  mongoose.disconnect();
}

seed();
