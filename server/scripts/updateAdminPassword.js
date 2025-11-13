import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';

const updateAdminPassword = async () => {
  try {
    const username = 'admin'; // Replace with the username you want to update
    const newPassword = 'admin123'; // Replace with the new password

    // Connect to the database
    await mongoose.connect('mongodb://mongo:27017/milk', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the admin password
    const result = await Admin.findOneAndUpdate(
      { username },
      { password: hashedPassword },
      { new: true }
    );

    if (result) {
      console.log(`Password updated successfully for user: ${username}`);
    } else {
      console.log(`User not found: ${username}`);
    }

    // Close the database connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error updating admin password:', error);
  }
};

updateAdminPassword();