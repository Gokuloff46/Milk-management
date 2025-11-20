import mongoose from 'mongoose';
import Customer from '../models/Customer.js';

function genCode(prefix = 'X', length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${out}`;
}

const createTestCustomers = async () => {
  try {
    await mongoose.connect('mongodb://mongo:27017/milk_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Test customers to add
    const testCustomers = [
      { name: 'John Doe', phone: '9876543210', address: '123 Main St' },
      { name: 'Jane Smith', phone: '9123456789', address: '456 Oak Ave' },
    ];

    for (const customerData of testCustomers) {
      // Check if customer already exists
      const existing = await Customer.findOne({ phone: customerData.phone });
      if (existing) {
        console.log(`Customer with phone ${customerData.phone} already exists, skipping...`);
        continue;
      }

      // Create new customer with unique customer code
      const customer = new Customer({
        ...customerData,
        customerCode: genCode('CUS')
      });
      await customer.save();
      console.log(`Created customer: ${customerData.name} (${customerData.phone})`);
    }

    console.log('Test customers setup complete!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error setting up test customers:', error);
    process.exit(1);
  }
};

createTestCustomers();
