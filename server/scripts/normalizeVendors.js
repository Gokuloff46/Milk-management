import mongoose from 'mongoose';
import Vendor from '../models/Vendor.js';

async function normalize() {
  await mongoose.connect('mongodb://localhost:27017/milk_management', { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    console.log('Scanning vendors for legacy approved boolean...');
    const vendors = await Vendor.find({});
    let changed = 0;
    for (const v of vendors) {
      if (typeof v.approved !== 'undefined') {
        // If approved boolean true -> set status to approved
        if (v.approved) {
          v.status = 'approved';
          console.log(`Converting vendor ${v._id} approved=true -> status='approved'`);
        } else if (!v.status) {
          // Ensure pending if no status present
          v.status = 'pending';
          console.log(`Setting vendor ${v._id} to status='pending'`);
        }
        // remove the legacy field
        v.approved = undefined;
        // direct unset of the field (mongoose will remove on save if undefined)
        await v.save();
        changed++;
      } else if (!v.status) {
        // ensure status exists for old records
        v.status = 'pending';
        await v.save();
        changed++;
      }
    }
    console.log(`Normalization complete. Documents changed: ${changed}`);
  } catch (err) {
    console.error('Migration failed', err);
  } finally {
    await mongoose.connection.close();
  }
}

normalize();
