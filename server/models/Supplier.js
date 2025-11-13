


import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String },
  address: { type: String },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Milk' }], // Products supplied
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Supplier', supplierSchema);
