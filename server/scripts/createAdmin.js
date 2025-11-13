import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function createAdmin() {
  await mongoose.connect(MONGO_URI);
  const exists = await Admin.findOne({ username: 'admin123' });
  if (exists) {
    console.log('Admin user already exists');
    process.exit(0);
  }
  await Admin.create({ username: 'admin123', password: 'admin123' });
  console.log('Admin user created: admin123 / admin123');
  process.exit(0);
}

createAdmin();
