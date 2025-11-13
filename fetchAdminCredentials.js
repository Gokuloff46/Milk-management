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

const fetchAdminCredentials = async () => {
  try {
    const Admin = mongoose.model('Admin', new mongoose.Schema({
      username: String,
      password: String,
    }));

    const admin = await Admin.findOne({ username: 'admin' });
    if (!admin) {
      console.log('Admin user not found');
    } else {
      console.log('Admin credentials:', admin);
    }
  } catch (err) {
    console.error('Error fetching admin credentials:', err);
  } finally {
    mongoose.connection.close();
  }
};

const main = async () => {
  await connectDB();
  await fetchAdminCredentials();
};

main();