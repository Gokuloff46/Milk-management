import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import Vendor from '../models/Vendor.js';
import Supplier from '../models/Supplier.js';
import Customer from '../models/Customer.js';
import Milk from '../models/Milk.js';

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/milk_management', { useNewUrlParser: true, useUnifiedTopology: true });

  // Clear collections
  await Promise.all([
    Admin.deleteMany({}),
    Vendor.deleteMany({}),
    Supplier.deleteMany({}),
    Customer.deleteMany({}),
    Milk.deleteMany({})
  ]);

  // Create admin
  const admin = await Admin.create({ username: 'admin', password: 'admin123' });

  // Create vendors
  const vendor1 = await Vendor.create({ name: 'Vendor One', email: 'vendor1@example.com', password: 'pass123', phone: '1234567890', address: '123 Main St', status: 'approved' });
  const vendor2 = await Vendor.create({ name: 'Vendor Two', email: 'vendor2@example.com', password: 'pass456', phone: '0987654321', address: '456 Side St', status: 'approved' });

  // Create suppliers
  const supplier1 = await Supplier.create({ name: 'Supplier One', contact: '9876543210', address: 'Supplier Address 1' });
  const supplier2 = await Supplier.create({ name: 'Supplier Two', contact: '8765432109', address: 'Supplier Address 2' });

  // Create products
  const milk = await Milk.create({ name: 'Milk', price: 50, unit: 'liter', supplier: supplier1._id, vendor: vendor1._id });
  const curd = await Milk.create({ name: 'Curd', price: 60, unit: 'kg', supplier: supplier2._id, vendor: vendor1._id });
  const ghee = await Milk.create({ name: 'Ghee', price: 500, unit: 'kg', supplier: supplier1._id, vendor: vendor2._id });
  const butter = await Milk.create({ name: 'Butter', price: 400, unit: 'kg', supplier: supplier2._id, vendor: vendor2._id });

  // Link products to vendors and suppliers
  vendor1.products = [milk._id, curd._id];
  vendor2.products = [ghee._id, butter._id];
  await vendor1.save();
  await vendor2.save();
  supplier1.products = [milk._id, ghee._id];
  supplier2.products = [curd._id, butter._id];
  await supplier1.save();
  await supplier2.save();

  // Create customers
  await Customer.create({ name: 'Customer One', email: 'cust1@example.com', password: 'cust123', address: 'Cust Address 1', phone: '1112223333', vendor: vendor1._id, paymentMethod: 'monthly' });
  await Customer.create({ name: 'Customer Two', email: 'cust2@example.com', password: 'cust456', address: 'Cust Address 2', phone: '4445556666', vendor: vendor2._id, paymentMethod: 'weekly' });

  console.log('Database seeded with demo entries.');
  mongoose.connection.close();
}

seed();
