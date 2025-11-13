/*
  Script: clean_duplicate_rates_via_api.js
  Purpose: Use the running server API to find duplicate milk entries (same supplier/vendor/global + price) and optionally delete duplicates.

  Usage:
    node server/scripts/clean_duplicate_rates_via_api.js --dry
    node server/scripts/clean_duplicate_rates_via_api.js --apply
*/

const fetch = globalThis.fetch || (await import('node-fetch')).default;
const argv = process.argv.slice(2);
const doApply = argv.includes('--apply');
const API_BASE = 'http://localhost:5000/api';

async function main() {
  console.log('Fetching milk entries from', `${API_BASE}/milk`);
  const res = await fetch(`${API_BASE}/milk`);
  if (!res.ok) throw new Error('Failed to fetch milk entries: ' + res.status);
  const data = await res.json();
  const milk = Array.isArray(data) ? data : (Array.isArray(data.milk) ? data.milk : data.milk || []);
  const map = new Map();
  milk.forEach(m => {
    const owner = m.supplier ? String(m.supplier) : (m.vendor ? String(m.vendor) : 'GLOBAL');
    const key = `${owner}::${m.price}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(m);
  });

  const duplicates = [];
  for (const [key, vals] of map.entries()) {
    if (vals.length > 1) duplicates.push({ key, vals });
  }

  console.log(`Found ${duplicates.length} duplicate groups`);
  duplicates.forEach(g => {
    console.log('Group:', g.key, 'Count:', g.vals.length, 'IDs:', g.vals.map(v => v._id).join(', '));
  });

  if (duplicates.length === 0) return;
  if (!doApply) {
    console.log('\nDry run complete. No deletions performed. Run with --apply to remove duplicates.');
    return;
  }

  let removed = 0;
  for (const g of duplicates) {
    const [keep, ...rest] = g.vals;
    for (const doc of rest) {
      try {
        const del = await fetch(`${API_BASE}/milk/${doc._id}`, { method: 'DELETE' });
        if (!del.ok) {
          console.error('Failed to delete', doc._id, await del.text());
          continue;
        }
        console.log('Deleted duplicate', doc._id);
        removed++;
      } catch (err) {
        console.error('Error deleting', doc._id, err.message);
      }
    }
  }
  console.log(`Removed ${removed} duplicates`);
}

main().catch(err => { console.error(err); process.exit(1); });
