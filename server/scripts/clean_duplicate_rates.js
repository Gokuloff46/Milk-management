/*
  Script: clean_duplicate_rates.js
  Purpose: Find duplicate milk rate documents (same price, same vendor/supplier if present) and optionally remove duplicates keeping one.

  Usage:
    node server/scripts/clean_duplicate_rates.js --dry
    node server/scripts/clean_duplicate_rates.js --apply

  Notes:
  - This script is safe by default (dry-run). Use --apply to perform deletions.
  - It connects using MONGO_URI from environment (same as server). Make sure your env is set.
*/

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Milk from '../models/Milk.js';

dotenv.config();

const argv = process.argv.slice(2);
const doApply = argv.includes('--apply');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in environment');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  // Fetch milk rate docs
  const rates = await Milk.find({}, { _id: 1, price: 1, supplier: 1, vendor: 1 }).lean();
  // Group by (supplier/vendor|null) + price
  const map = new Map();
  rates.forEach(r => {
    const owner = r.supplier ? String(r.supplier) : (r.vendor ? String(r.vendor) : 'GLOBAL');
    const key = `${owner}::${r.price}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r._id.toString());
  });

  const duplicates = [];
  for (const [key, ids] of map.entries()) {
    if (ids.length > 1) duplicates.push({ key, ids });
  }

  console.log(`Found ${duplicates.length} duplicated groups`);
  duplicates.forEach(group => {
    console.log('Group:', group.key, 'Count:', group.ids.length, 'IDs:', group.ids.join(', '));
  });

  if (duplicates.length === 0) {
    console.log('No duplicates found');
    await mongoose.disconnect();
    return;
  }

  if (!doApply) {
    console.log('\nDry run complete. No changes made. To remove duplicates run with --apply');
    await mongoose.disconnect();
    return;
  }

  // Apply deletions: keep first ID, remove others
  let removed = 0;
  for (const group of duplicates) {
    const [keep, ...rest] = group.ids;
    for (const id of rest) {
      try {
        await Milk.deleteOne({ _id: id });
        removed++;
        console.log('Deleted duplicate rate id', id);
      } catch (err) {
        console.error('Failed to delete', id, err.message);
      }
    }
  }

  console.log(`Removed ${removed} duplicate documents`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
