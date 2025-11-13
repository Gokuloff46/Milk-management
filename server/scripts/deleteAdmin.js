import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function deleteAdmin() {
  await mongoose.connect(MONGO_URI);
  const result = await Admin.deleteOne({ username: 'admin123' });
  if (result.deletedCount > 0) {
    console.log('Admin user deleted successfully');
  } else {
    console.log('Admin user not found');
  }
  process.exit(0);
}

deleteAdmin();
