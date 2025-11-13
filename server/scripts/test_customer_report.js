#!/usr/bin/env node
/*
  Simple script to call the customer report endpoint for manual testing.
  Usage: node test_customer_report.js <vendorId> <customerId>
*/
import fetch from 'node-fetch';

const [,, vendorId, customerId] = process.argv;
if (!vendorId || !customerId) {
  console.error('Usage: node test_customer_report.js <vendorId> <customerId>');
  process.exit(1);
}

async function main() {
  const url = `http://localhost:5000/api/vendors/${vendorId}/customers/${customerId}/report`;
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    const data = await res.json();
    console.log('Report response:', data);
  } catch (err) {
    console.error('Request failed:', err);
  }
}

main();
