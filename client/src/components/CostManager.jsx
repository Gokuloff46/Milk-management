import React, { useState, useEffect } from 'react';
import { getApiBase } from '../api.js';

function getPeriodDates(period) {
  const now = new Date();
  let start, end;
  end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // exclusive end
  if (period === 'daily') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'weekly') {
    const day = now.getDay();
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  } else if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'yearly') {
    start = new Date(now.getFullYear(), 0, 1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return { start, end };
}

export default function CostManager({ vendor = null }) {
  const [milk, setMilk] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [showMilkTotal, setShowMilkTotal] = useState(false);
  const [session, setSession] = useState('all');

  useEffect(() => {
    const vendorId = vendor && vendor._id ? vendor._id : null;
  const milkUrl = vendorId ? `${getApiBase()}/vendors/${vendorId}/milk` : `${getApiBase()}/milk`;
    fetch(milkUrl)
      .then(res => res.json())
      .then(res => setMilk(Array.isArray(res) ? res : (Array.isArray(res.milk) ? res.milk : [])))
      .catch(() => setMilk([]));
  const salesUrl = vendorId ? `${getApiBase()}/sales?vendor=${vendorId}` : `${getApiBase()}/sales`;
    fetch(salesUrl)
      .then(res => res.json())
      .then(res => setSales(Array.isArray(res) ? res : (Array.isArray(res.sales) ? res.sales : [])))
      .catch(() => setSales([]));
  const prodUrl = vendorId ? `${getApiBase()}/products?vendor=${vendorId}` : `${getApiBase()}/products`;
    fetch(prodUrl)
      .then(res => res.json())
      .then(res => setProducts(Array.isArray(res) ? res : (Array.isArray(res.products) ? res.products : [])))
      .catch(() => setProducts([]));
  }, [vendor]);

  const { start, end } = getPeriodDates(period);

  // Filter milk and sales by selected period and date
  let filteredMilk = milk.filter(item => {
    if (!item.date) return false;
    const d = new Date(item.date);
    if (period === 'custom') {
      // Only match the selected date
      return d.toISOString().slice(0, 10) === date;
    }
    return d >= start && d < end;
  });
  if (session !== 'all') {
    filteredMilk = filteredMilk.filter(item => item.session === session);
  }
  const filteredSales = sales.filter(item => {
    if (!item.date) return false;
    const d = new Date(item.date);
    if (period === 'custom') {
      return d.toISOString().slice(0, 10) === date;
    }
    return d >= start && d < end;
  });

  // `MilkManager` stores `price` as the entry total for that milk record (liter * vendorPrice).
  // So the total milk cost is the sum of entry.price values.
  const totalMilkCost = filteredMilk.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const totalSales = filteredSales.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);

  return (
    <div style={{ padding: 24 }}>
      <h2>Cost Management</h2>
      <div style={{
        marginBottom: 16,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'flex-start',
        rowGap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label htmlFor="period">Period:</label>
          <select id="period" value={period} onChange={e => setPeriod(e.target.value)} style={{ minWidth: 90 }}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="custom">Custom Date</option>
          </select>
        </div>
        {period === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label htmlFor="date">Date:</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}
            />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label htmlFor="session">Session:</label>
          <select id="session" value={session} onChange={e => setSession(e.target.value)} style={{ minWidth: 110 }}>
            <option value="all">All Sessions</option>
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 16, background: '#f7f7f7', padding: 12, borderRadius: 8 }}>
        <strong>Milk Total Cost ({period === 'custom' ? date : period}):</strong> ₹{totalMilkCost.toFixed(2)} &nbsp; | &nbsp;
        <strong>Sales Total ({period === 'custom' ? date : period}):</strong> ₹{totalSales.toFixed(2)}
        <button style={{ marginLeft: 16 }} onClick={() => setShowMilkTotal(!showMilkTotal)}>Session: Milk Cost</button>
        {showMilkTotal && (
          <span style={{ marginLeft: 16, color: 'green' }}><b>Total Milk Cost: ₹{totalMilkCost.toFixed(2)}</b></span>
        )}
      </div>
          <table style={{ width: '100%', marginBottom: 16, background: '#fff', borderRadius: 8 }}>
            <thead>
              <tr style={{ background: '#b3e0ff' }}>
                <th>Total Milk (Liters)</th>
                <th>Total Milk Cost (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{filteredMilk.reduce((sum, item) => sum + (parseFloat(item.liter ?? item.quantity) || 0), 0)}</td>
                <td>{filteredMilk.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Sale Date</th>
            <th>Product</th>
            <th>Customer</th>
            <th>Quantity</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {filteredSales.map(item => {
            let productName = 'Unknown';
            let productId = item.productId;
            if (typeof productId === 'object' && productId !== null) {
              if (productId.name) productName = productId.name;
              if (productId._id) {
                const product = products.find(p => p._id === productId._id);
                if (product) productName = product.name;
              }
            } else if (typeof productId === 'string') {
              let product = products.find(p => p._id === productId);
              if (!product) {
                product = products.find(p => p.name === productId);
              }
              if (product) productName = product.name;
            }
            return (
              <tr key={item._id}>
                <td>{item.date ? new Date(item.date).toLocaleDateString() : ''}</td>
                <td>{productName}</td>
                <td>{item.customer}</td>
                <td>{item.quantity}</td>
                <td>{item.total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
