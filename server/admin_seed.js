import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const exists = await Admin.findOne({ username: 'admin123' });
    if (!exists) {
      await Admin.create({ username: 'admin123', password: 'admin123' });
      console.log('Admin user created: admin123 / admin123');
    } else {
      console.log('Admin user already exists.');
    }
    mongoose.disconnect();
  })
  .catch((err) => console.error(err));
