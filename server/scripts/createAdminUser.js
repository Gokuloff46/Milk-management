import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';

const createAdminUser = async () => {
  try {
    const username = 'admin123';
    const password = 'admin123';

    // Connect to the correct database
    await mongoose.connect('mongodb://mongo:27017/milk_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if the admin user already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log(`Admin user already exists: ${username}`);
      await mongoose.connection.close();
      return;
    }

    // Create the new admin user (password will be hashed automatically by the model)
    const newAdmin = new Admin({ username, password });
    await newAdmin.save();

    console.log(`Admin user created successfully with username: ${username}`);

    // Close the database connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
