import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import adminExtraRoutes from './routes/admin_extra.js';
import adminRoutes from './routes/admin.js';
import milkRoutes from './routes/milk.js';
import supplierRoutes from './routes/suppliers.js';
import salesRoutes from './routes/sales.js';
import customerRoutes from './routes/customers.js';
import vendorRoutes from './routes/vendors.js';
import productsRouter from './routes/products.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
// Allow requests from localhost:3000 and deployed frontend
const allowedOrigins = [
  'http://localhost:3000',
  'https://milk.kgr.life',
  'https://www.milk.kgr.life'
];
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/milk', milkRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin-extra', adminExtraRoutes);
app.use('/api/products', productsRouter);

const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    try {
      // Prefer an explicit MONGODB_URI, otherwise try localhost first for local dev
      const defaultUri = 'mongodb://127.0.0.1:27017/milk_management';
      const dockerUri = 'mongodb://mongo:27017/milk_management';
      const uri = process.env.MONGODB_URI || defaultUri || dockerUri;
      await mongoose.connect(uri);
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  } else {
    console.log('MongoDB connection already established');
  }
};

// Test MongoDB connection endpoint
app.get('/test-mongo', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).send('MongoDB connection is healthy');
  } catch (error) {
    res.status(500).send('MongoDB connection failed: ' + error.message);
  }
});

const PORT = process.env.PORT || 5000;

// Ensure MongoDB connects before starting the server to avoid buffering timeouts
(async () => {
  try {
    await connectDB();
  // Bind explicitly to 0.0.0.0 so the server is reachable from other containers
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
  } catch (err) {
    console.error('Failed to start server due to MongoDB connection error:', err);
    process.exit(1);
  }
})();

// Serve React app for all non-API routes

app.use(express.static(path.join(__dirname, '../client/dist')));

app.use((req, res, next) => {
  if (req.url.endsWith('.mjs')) {
    res.setHeader('Content-Type', 'application/javascript');
  }
  next();
});

app.get('*', (req, res) => {
  // Only handle non-API routes
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});
