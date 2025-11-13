// Serve PDF for download with Content-Disposition: attachment
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from 'express';
import Milk from '../models/Milk.js';
import Customer from '../models/Customer.js';
import multer from 'multer';

const router = express.Router();

router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
  res.sendFile(filePath, err => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Create a new milk record
router.post('/', async (req, res) => {
  try {
    const { session, liter, price, date, customer, vendor } = req.body;
    const newMilk = new Milk({
      session,
      liter,
      price,
      date,
      customer,
      ...(vendor ? { vendor } : {})
    });
    const savedMilk = await newMilk.save();
    res.status(201).json(savedMilk);
  } catch (error) {
    res.status(400).json({ message: 'Error creating milk record', error });
  }
});
// End of vendor-specific milk route

// Get all milk records for a specific vendor
router.get('/vendors/:vendorId/milk', async (req, res, next) => {
  // This route is not used directly; see below for correct mounting
  next();
});

// Correct vendor milk route for API: /api/vendors/:vendorId/milk
router.get('/:vendorId/milk', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { period, session } = req.query;
    const { start, end } = getPeriodDates(period);

    let query = {
      vendor: vendorId,
      date: {
        $gte: start,
        $lt: end,
      },
    };
    if (session && session !== 'All Sessions') {
      query.session = session;
    }
    const milk = await Milk.find(query).populate('customer');
    res.json(milk);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendor milk records', error });
  }
});

// Get all milk records
router.get('/', async (req, res) => {
  try {
    const { period, session } = req.query;
    const { start, end } = getPeriodDates(period);

    let query = {
      date: {
        $gte: start,
        $lt: end,
      },
    };

    if (session && session !== 'All Sessions') {
      query.session = session;
    }

    const milk = await Milk.find(query).populate('customer');
    res.json(milk);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching milk records', error });
  }
});

// Get milk bill for a customer
router.get('/customer/:customerId/bill', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { period } = req.query; // e.g., 'monthly'

    const { start, end } = getPeriodDates(period);

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const milkRecords = await Milk.find({
      customer: customerId,
      date: {
        $gte: start,
        $lt: end,
      },
    }).sort({ date: 1 });

    const itemizedDetails = milkRecords.map(record => ({
      date: record.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      itemDescription: 'Cow Milk', // Assuming 'Cow Milk' for now
      quantity: record.liter,
      rate: record.price / record.liter,
      total: record.price,
    }));

    const subtotal = itemizedDetails.reduce((acc, item) => acc + item.total, 0);
    const tax = 0; // Assuming 0 tax for now
    const invoiceTotal = subtotal + tax;

    const bill = {
      invoiceNo: `INV-${Date.now()}`,
      invoiceDate: new Date().toLocaleDateString('en-GB'),
      billPeriod: `${start.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`,
      dueDate: new Date(end.getFullYear(), end.getMonth(), end.getDate() + 15).toLocaleDateString('en-GB'), // Due 15 days after bill period ends
      billTo: {
        name: customer.name,
        address: customer.address,
        contactNumber: customer.phone,
      },
      itemizedDetails,
      summary: {
        subtotal,
        tax,
        invoiceTotal,
      },
      paymentInformation: {
        upi: '[Your UPI ID]',
        bankTransfer: '[Bank Name, Account Number, IFSC Code]',
      }
    };

    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching milk bill', error: error.message });
  }
});

function getPeriodDates(period) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();

  let start, end;

  if (period === 'daily') {
    start = new Date(Date.UTC(year, month, day));
    end = new Date(Date.UTC(year, month, day + 1));
  } else if (period === 'weekly') {
    const dayOfWeek = now.getUTCDay();
    start = new Date(Date.UTC(year, month, day - dayOfWeek));
    end = new Date(Date.UTC(year, month, day - dayOfWeek + 7));
  } else if (period === 'monthly') {
    start = new Date(Date.UTC(year, month, 1));
    end = new Date(Date.UTC(year, month + 1, 1));
  } else if (period === 'yearly') {
    start = new Date(Date.UTC(year, 0, 1));
    end = new Date(Date.UTC(year + 1, 0, 1));
  } else {
    // Default to daily
    start = new Date(Date.UTC(year, month, day));
    end = new Date(Date.UTC(year, month, day + 1));
  }
  return { start, end };
}

// Upload bill PDF
router.post('/upload-bill', upload.single('billPdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ message: 'File uploaded successfully', filename: req.file.filename, fileUrl });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

export default router;