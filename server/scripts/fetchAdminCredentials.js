import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/milk_management';

async function fetchAdminCredentials() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const admins = await Admin.find();
    console.log('Admin credentials:', admins);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error fetching admin credentials:', error);
  }
}

fetchAdminCredentials();