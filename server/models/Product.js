import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  unit: { type: String, enum: ['liter', 'kg'], required: true },
  price: { type: Number, required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
export default Product;
