import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/milk');
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const updateAdminPassword = async () => {
  try {
    const Admin = mongoose.model('Admin', new mongoose.Schema({
      username: String,
      password: String,
    }));

    const plaintextPassword = 'admin123'; // Replace with your desired password
    const hashedPassword = await bcrypt.hash(plaintextPassword, 10);

    const result = await Admin.updateOne(
      { username: 'admin' },
      { $set: { password: hashedPassword } }
    );

    if (result.modifiedCount > 0) {
      console.log('Admin password updated successfully');
    } else {
      console.log('Admin user not found or password not updated');
    }
  } catch (err) {
    console.error('Error updating admin password:', err);
  } finally {
    mongoose.connection.close();
  }
};

const main = async () => {
  await connectDB();
  await updateAdminPassword();
};

main();