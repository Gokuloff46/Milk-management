const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');

const queryVendorCollection = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/milk_management';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const vendors = await Vendor.find();
    console.log('Vendor Records:', vendors);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error querying Vendor collection:', error);
  }
};

queryVendorCollection();