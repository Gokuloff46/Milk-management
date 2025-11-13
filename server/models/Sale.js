


import mongoose from 'mongoose';


const saleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Reference to Product
  customer: { type: String, required: true }, // Manual customer name
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' }
});

export default mongoose.model('Sale', saleSchema);
