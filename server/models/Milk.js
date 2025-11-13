


import mongoose from 'mongoose';

const milkSchema = new mongoose.Schema({
  paymentStatus: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true }, // Reference to customer
  session: { type: String, enum: ['morning', 'evening'], required: true },
  liter: { type: Number, required: true },
  price: { type: Number, required: true },
  date: { type: Date, required: true },
  // legacy fields for compatibility
  name: { type: String, required: false },
  unit: { type: String, enum: ['liter', 'kg'], required: false },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: false },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Milk', milkSchema);
