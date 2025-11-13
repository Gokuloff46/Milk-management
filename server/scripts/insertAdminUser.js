import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';

const insertAdminUser = async () => {
  try {
    const username = 'admin'; // Replace with desired username
    const password = 'admin123'; // Replace with desired password

    // Connect to the database
    await mongoose.connect('mongodb://mongo:27017/milk', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Check if the admin user already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log(`Admin user already exists: ${username}`);
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the new admin user
    const newAdmin = new Admin({ username, password: hashedPassword });
    await newAdmin.save();

    console.log(`Admin user created successfully: ${username}`);

    // Close the database connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error inserting admin user:', error);
  }
};

insertAdminUser();