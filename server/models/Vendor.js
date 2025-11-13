


import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'deactivated'], default: 'pending' },
  // Default milk price (per liter) for this vendor. Optional.
  defaultMilkPrice: { type: Number, required: false },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Milk' }], // Products managed by vendor
  vendorCode: { type: String, unique: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Vendor', vendorSchema);
