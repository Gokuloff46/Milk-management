// Print bill handler
function handlePrintBill(sale, product) {
  var win = window.open('', 'Print Bill', 'width=400,height=600');
  var html = '<html><head><title>Print Bill</title></head><body>' +
    '<h2>Milk Management Bill</h2>' +
    '<hr />' +
    '<p><strong>Product:</strong> ' + (product ? product.name : sale.productId) + '</p>' +
    '<p><strong>Customer:</strong> ' + sale.customer + '</p>' +
    '<p><strong>Quantity:</strong> ' + sale.quantity + '</p>' +
    '<p><strong>Total:</strong> ₹' + sale.total + '</p>' +
    '<p><strong>Date:</strong> ' + sale.date.split('T')[0] + '</p>' +
    '<hr />' +
    '<p>Thank you for your purchase!</p>' +
    '<script>window.print();</script>' +
    '</body></html>';
  win.document.write(html);
  win.document.close();
}

import React, { useEffect, useState } from 'react';
import './SalesManager.css';
import { getApiBase } from '../api.js';

function SalesManager({ products = [], sales = [], vendor = null }) {
  const [localSales, setLocalSales] = useState(sales);
  // Helper to fetch sales (vendor-scoped when vendor is provided)
  async function fetchSales() {
    try {
      let res;
      if (vendor && vendor._id) {
        res = await fetch(`${getApiBase()}/vendors/${vendor._id}/customer-payments`);
      } else {
        res = await fetch(`${getApiBase()}/sales`);
      }
      if (!res.ok) throw new Error('Failed to fetch sales');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.sales || data);
      setLocalSales(list);
    } catch (err) {
      console.error('fetchSales error', err);
      // fall back to prop sales if available
      setLocalSales(Array.isArray(sales) ? sales : (sales.sales || []));
    }
  }

  // Keep localSales in sync: if vendor present, load vendor-scoped sales; otherwise use prop
  useEffect(() => {
    if (vendor && vendor._id) {
      fetchSales();
    } else {
      setLocalSales(Array.isArray(sales) ? sales : (sales.sales || []));
    }
  }, [sales, vendor]);
  // Defensive: handle both array and object API responses
  if (!Array.isArray(products) && products && typeof products === 'object') {
    products = products.products || [];
  } else if (!Array.isArray(products)) {
    products = [];
  }
  if (!Array.isArray(sales) && sales && typeof sales === 'object') {
    sales = sales.sales || [];
  } else if (!Array.isArray(sales)) {
    sales = [];
  }
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ productId: '', customer: '', quantity: '', total: '', date: today });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!form.productId || !form.quantity) {
      if (form.total !== '') {
        setForm(f => ({ ...f, total: '' }));
      }
      return;
    }
    const product = products.find(p => p._id === form.productId);
    if (product) {
      const qty = parseFloat(form.quantity);
      const price = parseFloat(product.price);
      const newTotal = (!isNaN(qty) && !isNaN(price)) ? (qty * price).toFixed(2) : '';
      if (form.total !== newTotal) {
        setForm(f => ({ ...f, total: newTotal }));
      }
    }
  }, [form.productId, form.quantity, products]);

  async function addSale(sale) {
    const payload = vendor && vendor._id ? { ...sale, vendor: vendor._id } : sale;
    const res = await fetch(`${getApiBase()}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to add sale');
    return await res.json();
  }
  async function updateSale(id, sale) {
    const res = await fetch(`${getApiBase()}/sales/${id}`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale)
    });
    if (!res.ok) throw new Error('Failed to update sale');
    return await res.json();
  }
  async function deleteSale(id) {
    const res = await fetch(`${getApiBase()}/sales/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete sale');
    // refresh from server to ensure vendor-scoped and normalized data
    await fetchSales();
  }

  // Print bill handler
  function handlePrintBill(sale, product) {
    const win = window.open('', 'Print Bill', 'width=400,height=600');
    win.document.write(`
      <html><head><title>Print Bill</title></head><body>
        <h2>Milk Management Bill</h2>
        <hr />
        <p><strong>Product:</strong> ${product ? product.name : sale.productId}</p>
        <p><strong>Customer:</strong> ${sale.customer}</p>
        <p><strong>Quantity:</strong> ${sale.quantity}</p>
        <p><strong>Total:</strong> ₹${sale.total}</p>
        <p><strong>Date:</strong> ${sale.date.split('T')[0]}</p>
        <hr />
        <p>Thank you for your purchase!</p>
        <script>window.print();</script>
      </body></html>
    `);
    win.document.close();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!form.productId || !form.customer || !form.quantity) {
      setError('Please fill all fields.');
      setLoading(false);
      return;
    }
    try {
      let newSale;
      if (editing) {
        newSale = await updateSale(editing, form);
        // refresh list from server to keep vendor-scoped data accurate
        await fetchSales();
      } else {
        newSale = await addSale(form);
        // refresh list from server to keep vendor-scoped data accurate
        await fetchSales();
      }
      setForm({ productId: '', customer: '', quantity: '', total: '', date: today });
      setEditing(null);
    } catch (err) {
      setError('Error: ' + (err.message || err));
    }
    setLoading(false);
  };

  const handleEdit = (sale) => {
    setEditing(sale._id);
    setForm({
      productId: typeof sale.productId === 'object' ? sale.productId._id : sale.productId,
      customer: sale.customer,
      quantity: sale.quantity,
      total: sale.total,
      date: sale.date.split('T')[0]
    });
  };

  return (
    <div className="sales-manager-container">
      <div className="sales-card">
        <h2 className="sales-title">Add Sales Record</h2>
        <form className="sales-form" onSubmit={handleSubmit}>
          <select
            value={form.productId}
            onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
            required
          >
            <option value="">Select Product</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Customer Name"
            value={form.customer}
            onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
            required
            min="0.01"
            step="0.01"
          />
          <input
            type="text"
            placeholder="Total Price (auto)"
            value={form.total}
            readOnly
          />
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            required
          />
          <button type="submit" className="sales-add-btn" disabled={loading}>
            {editing ? 'Update Sale' : 'Add Sale'}
          </button>
          {error && <div className="sales-error">{error}</div>}
        </form>
        <hr />
        <h3 className="sales-subtitle">Sales Records</h3>
        <div className="sales-card">
          <div className="sales-table-scroll">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {localSales.map(sale => {
                  const product = products.find(p => p._id === sale.productId);
                  return (
                    <tr key={sale._id}>
                      <td>{product ? product.name : (typeof sale.productId === 'string' ? sale.productId : sale.productId?.name || '[Unknown]')}</td>
                      <td>{sale.customer}</td>
                      <td>{sale.quantity}</td>
                      <td>₹{sale.total}</td>
                      <td>{sale.date.split('T')[0]}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button className="sales-edit-btn" onClick={() => handleEdit(sale)}>Edit</button>
                          <button className="sales-delete-btn" onClick={() => deleteSale(sale._id)}>Delete</button>
                          <button className="sales-print-btn" onClick={() => handlePrintBill(sale, product)}>Print</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  // Always render the form and table
  return (
    <div className="sales-manager-root" style={{ border: '2px solid #3a7bd5', minHeight: 300, padding: 16, background: '#fff' }}>
      <h2 style={{ color: '#3a7bd5', marginBottom: 16 }}>Sales Manager</h2>
      <form style={{ marginBottom: 24, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }} onSubmit={e => { e.preventDefault(); if (!form.productId || !form.customer || !form.quantity) return; }}>
        <select
          name="productId"
          value={form.productId}
          onChange={e => setForm({ ...form, productId: e.target.value })}
          style={{ minWidth: 120, padding: 6 }}
        >
          <option value="">Select Product</option>
          {products.map(p => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <input
          type="text"
          name="customer"
          value={form.customer}
          onChange={e => setForm({ ...form, customer: e.target.value })}
          placeholder="Customer Name"
          style={{ minWidth: 120, padding: 6 }}
        />
        <input
          type="number"
          name="quantity"
          value={form.quantity}
          onChange={e => setForm({ ...form, quantity: e.target.value })}
          placeholder="Quantity"
          style={{ minWidth: 80, padding: 6 }}
        />
        <input
          type="number"
          name="total"
          value={form.total}
          readOnly
          placeholder="Total Price"
          style={{ minWidth: 100, padding: 6, background: '#eee' }}
        />
        <input
          type="date"
          name="date"
          value={form.date || ''}
          onChange={e => setForm({ ...form, date: e.target.value })}
          style={{ minWidth: 120, padding: 6 }}
        />
        <button type="submit" style={{ background: '#3a7bd5', color: '#fff', padding: '6px 18px', border: 'none', borderRadius: 8, fontWeight: 700 }}>Add Sale</button>
      </form>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr style={{ background: '#e3f2fd' }}>
            <th style={{ padding: 8, border: '1px solid #90caf9' }}>Product</th>
            <th style={{ padding: 8, border: '1px solid #90caf9' }}>Customer Name</th>
            <th style={{ padding: 8, border: '1px solid #90caf9' }}>Quantity</th>
            <th style={{ padding: 8, border: '1px solid #90caf9' }}>Total Price</th>
            <th style={{ padding: 8, border: '1px solid #90caf9' }}>Date</th>
            <th style={{ padding: 8, border: '1px solid #90caf9' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16, color: '#e53935' }}>No sales records found.</td></tr>
          )}
          {sales.map(item => {
            const product = products.find(p => p._id === item.productId);
            if (!product) return null;
            return (
              <tr key={item._id} style={{ background: '#fff' }}>
                <td style={{ padding: 8, border: '1px solid #90caf9' }}>{product.name}</td>
                <td style={{ padding: 8, border: '1px solid #90caf9' }}>{item.customer}</td>
                <td style={{ padding: 8, border: '1px solid #90caf9' }}>{item.quantity}</td>
                <td style={{ padding: 8, border: '1px solid #90caf9' }}>₹{item.total}</td>
                <td style={{ padding: 8, border: '1px solid #90caf9' }}>{item.date ? new Date(item.date).toLocaleDateString() : ''}</td>
                <td style={{ padding: 8, border: '1px solid #90caf9' }}>
                  <button style={{ marginRight: 8, background: '#ffb74d', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Edit</button>
                  <button style={{ marginRight: 8, background: '#e53935', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
                  <button style={{ background: '#2196f3', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Print</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <h2 className="sales-manager-title">Add Sales Record</h2>
      <form onSubmit={handleSubmit} className="sales-manager-form sales-manager-form-portrait">
        <select
          name="productId"
          value={form.productId}
          onChange={e => setForm({ ...form, productId: e.target.value })}
          className="sales-manager-select"
        >
          <option value="">Select Product</option>
          {products.map(p => (
            <option key={p._id} value={p._id}>{p.name} ({p.capacity} {p.unit})</option>
          ))}
        </select>
        <input
          type="text"
          name="customer"
          value={form.customer}
          onChange={e => setForm({ ...form, customer: e.target.value })}
          placeholder="Customer Name"
          className="sales-manager-input"
        />
        <input
          type="number"
          name="quantity"
          value={form.quantity}
          onChange={e => setForm({ ...form, quantity: e.target.value })}
          placeholder="Quantity"
          className="sales-manager-input"
        />
        <input
          type="number"
          name="total"
          value={form.total}
          readOnly
          placeholder="Total Price (auto)"
          className="sales-manager-input readonly"
        />
        <input
          type="date"
          name="date"
          value={form.date || ''}
          onChange={e => setForm({ ...form, date: e.target.value })}
          className="sales-manager-input"
        />
        <button
          type="submit"
          disabled={loading}
          className="sales-manager-btn"
        >
          {editing ? 'Update' : loading ? 'Saving...' : 'Add Sale'}
        </button>
        {error && <div className="sales-manager-error">{error}</div>}
      </form>
      <hr className="sales-manager-divider" />
      <div className="sales-manager-records-header">
        <h3>Sales Records</h3>
      </div>
      <div className="sales-manager-cards-list">
    {/* Table-based sales record rendering is now handled above. */}
      </div>
    </div>
  );

  return (
    <div className="sales-manager-root">
      {error && (
        <div className="sales-manager-error" style={{ color: '#e53935', fontWeight: 600, marginBottom: 16 }}>
          Error: {error}
        </div>
      )}
      <button className="hamburger-menu-btn" onClick={() => setMenuOpen(true)}>
        <span style={{fontSize: '2rem'}}>&#9776;</span>
      </button>
      {menuOpen && (
        <div className="side-menu-overlay" onClick={() => setMenuOpen(false)} />
      )}
      <nav className={`side-menu${menuOpen ? ' open' : ''}`}>
        <button className="close-menu-btn" onClick={() => setMenuOpen(false)}>
          <span style={{fontSize: '2rem'}}>&#10005;</span>
        </button>
        <ul>
          {MENU_ITEMS.map(item => (
            <li key={item.key}>
              <button className="side-menu-item" onClick={() => {/* handle navigation */ setMenuOpen(false); }}>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <h2 className="sales-manager-title">Sales Manager</h2>
      <div className="sales-manager-card">
        <h2 className="sales-manager-title">Add Sales Record</h2>
        <form onSubmit={handleSubmit} className="sales-manager-form">
          <select
            name="productId"
            value={form.productId}
            onChange={e => setForm({ ...form, productId: e.target.value })}
            className="sales-manager-select"
          >
            <option value="">Select Product</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.name} ({p.capacity} {p.unit})</option>
            ))}
          </select>
          <input
            type="text"
            name="customer"
            value={form.customer}
            onChange={e => setForm({ ...form, customer: e.target.value })}
            placeholder="Customer Name"
            className="sales-manager-input"
          />
          <input
            type="number"
            name="quantity"
            value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
            placeholder="Quantity"
            className="sales-manager-input"
          />
          <input
            type="number"
            name="total"
            value={form.total}
            readOnly
            placeholder="Total Price (auto)"
            className="sales-manager-input readonly"
          />
          <input
            type="date"
            name="date"
            value={form.date || ''}
            onChange={e => setForm({ ...form, date: e.target.value })}
            className="sales-manager-input"
          />
          <button
            type="submit"
            disabled={loading}
            className="sales-manager-btn"
          >
            {editing ? 'Update' : loading ? 'Saving...' : 'Add Sale'}
          </button>
          {error && <div className="sales-manager-error">{error}</div>}
        </form>
        <hr className="sales-manager-divider" />
        <div className="sales-manager-records-header">
          <h3>Sales Records</h3>
          <button onClick={handleExportPDF} className="sales-manager-btn export">Export PDF</button>
        </div>
        <div className="sales-manager-controls">
          <select
            value={filterProduct}
            onChange={e => setFilterProduct(e.target.value)}
            className="sales-manager-select"
          >
            <option value="">All Products</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="sales-manager-input"
          />
          <select
            value={filterMode}
            onChange={e => setFilterMode(e.target.value)}
            className="sales-manager-select"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="sales-manager-table-wrapper">
          {sales.length === 0 && !error && (
            <div style={{color: '#e53935', fontWeight: 600, padding: 16, textAlign: 'center'}}>
              No sales data found. Please check backend or add sales records.<br />
              <span style={{fontSize: '1rem', color: '#333'}}>If you see this message and have sales in your database, the frontend is not receiving data from the backend.</span>
            </div>
          )}
          <table id="sales-table" className="sales-manager-table">
            <thead>
              <tr className="sales-manager-table-header">
                <th>Product</th>
                <th>Customer</th>
                <th>Quantity</th>
                <th style={{ padding: 8 }}>Total</th>
                <th style={{ padding: 8 }}>Date</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.filter(item => {
                if (filterProduct && (item.productId !== filterProduct && (!item.productId || item.productId._id !== filterProduct))) return false;
                if (filterDate && item.date) {
                  const itemDateObj = new Date(item.date);
                  const filterDateObj = new Date(filterDate);
                  if (filterMode === 'daily') {
                    if (itemDateObj.toISOString().split('T')[0] !== filterDate) return false;
                  } else if (filterMode === 'weekly') {
                    const day = filterDateObj.getDay();
                    const weekStart = new Date(filterDateObj);
                    weekStart.setDate(filterDateObj.getDate() - day);
                    weekStart.setHours(0,0,0,0);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    weekEnd.setHours(23,59,59,999);
                    if (itemDateObj < weekStart || itemDateObj > weekEnd) return false;
                  } else if (filterMode === 'monthly') {
                    if (
                      itemDateObj.getFullYear() !== filterDateObj.getFullYear() ||
                      itemDateObj.getMonth() !== filterDateObj.getMonth()
                    ) return false;
                  }
                }
                return true;
              }).map(item => {
                let productName = 'Unknown';
                if (item.productId && typeof item.productId === 'object' && item.productId.name) {
                  productName = item.productId.name;
                } else {
                  const product = products.find(p => p._id === item.productId);
                  if (product) productName = product.name;
                }
                return (
                  <tr key={item._id} className="sales-manager-table-row">
                    <td>{productName}</td>
                    <td>{item.customer}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.total}</td>
                    <td>{item.date ? new Date(item.date).toLocaleDateString() : ''}</td>
                    <td>
                      <button onClick={() => handleEdit(item)} className="sales-manager-btn" style={{ marginRight: 8 }}>Edit</button>
                      <button onClick={() => handleDelete(item._id)} className="sales-manager-btn delete">Delete</button>
                    </td>
                  </tr>
                );
              })}
              {sales.filter(item => {
                if (filterProduct && (item.productId !== filterProduct && (!item.productId || item.productId._id !== filterProduct))) return false;
                if (filterDate && item.date) {
                  const itemDateObj = new Date(item.date);
                  const filterDateObj = new Date(filterDate);
                  if (filterMode === 'daily') {
                    if (itemDateObj.toISOString().split('T')[0] !== filterDate) return false;
                  } else if (filterMode === 'weekly') {
                    const day = filterDateObj.getDay();
                    const weekStart = new Date(filterDateObj);
                    weekStart.setDate(filterDateObj.getDate() - day);
                    weekStart.setHours(0,0,0,0);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    weekEnd.setHours(23,59,59,999);
                    if (itemDateObj < weekStart || itemDateObj > weekEnd) return false;
                  } else if (filterMode === 'monthly') {
                    if (
                      itemDateObj.getFullYear() !== filterDateObj.getFullYear() ||
                      itemDateObj.getMonth() !== filterDateObj.getMonth()
                    ) return false;
                  }
                }
                return true;
              }).length === 0 && (
                <tr><td colSpan={6} className="sales-manager-table-empty">No sales found for selected filter.</td></tr>
              )}
            </tbody>
          </table>
          {/* Total sales summary for filtered sales */}
          {(() => {
            const filtered = sales.filter(item => {
              if (filterProduct && (item.productId !== filterProduct && (!item.productId || item.productId._id !== filterProduct))) return false;
              if (filterDate && item.date) {
                const itemDateObj = new Date(item.date);
                const filterDateObj = new Date(filterDate);
                if (filterMode === 'daily') {
                  if (itemDateObj.toISOString().split('T')[0] !== filterDate) return false;
                } else if (filterMode === 'weekly') {
                  const day = filterDateObj.getDay();
                  const weekStart = new Date(filterDateObj);
                  weekStart.setDate(filterDateObj.getDate() - day);
                  weekStart.setHours(0,0,0,0);
                  const weekEnd = new Date(weekStart);
                  weekEnd.setDate(weekStart.getDate() + 6);
                  weekEnd.setHours(23,59,59,999);
                  if (itemDateObj < weekStart || itemDateObj > weekEnd) return false;
                } else if (filterMode === 'monthly') {
                  if (
                    itemDateObj.getFullYear() !== filterDateObj.getFullYear() ||
                    itemDateObj.getMonth() !== filterDateObj.getMonth()
                  ) return false;
                }
              }
              return true;
            });
            const totalCount = filtered.length;
            const totalPrice = filtered.reduce((sum, item) => sum + Number(item.total || 0), 0);
            return (
              <div className="sales-manager-summary">
                Total Sales Count: {totalCount} | Total Sales Price: ₹{totalPrice}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
export default SalesManager;