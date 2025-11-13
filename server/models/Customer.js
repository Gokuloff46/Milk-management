


import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // email: { type: String, unique: true },
  // password: { type: String },
    address: { type: String },
    phone: { type: String },
    // Authentication helpers
    pinHash: { type: String, default: null },
    otpHash: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    verified: { type: Boolean, default: false },
    date: { type: Date }, // Custom date field for customer
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null }, // Link to vendor
  customerCode: { type: String, unique: true, index: true, default: null },
  // paymentMethod: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'monthly' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Customer', customerSchema);
