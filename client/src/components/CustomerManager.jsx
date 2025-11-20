import React, { useState, useEffect } from 'react';
import './CustomerManager.css';

import { getApiBase } from '../api.js';
const API = `${getApiBase()}/customers`;

function getPeriodDates(period) {
  const now = new Date();
  let start, end;
  end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (period === 'all') {
    start = new Date('2000-01-01'); // Show all records from year 2000
  } else if (period === 'daily') {
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

export default function CustomerManager({ vendor, vendorPeriod }) {
  // PDF export handler
  const handleExportPDF = async () => {
    const jsPDF = (await import('jspdf')).default;
    const html2canvas = (await import('html2canvas')).default;
    const doc = new jsPDF();
    const list = document.getElementById('customer-list');
    if (!list) return;
    const canvas = await html2canvas(list);
    const imgData = canvas.toDataURL('image/png');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = pageWidth - 20;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    doc.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
    doc.save('CustomerList.pdf');
  };
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' });
  // allow parent to provide an initial period without colliding with local state
  const [period, setPeriod] = useState(vendorPeriod || 'all');

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
  const url = vendor && vendor._id ? `${getApiBase()}/vendors/${vendor._id}/customers` : API;
      const res = await fetch(url);
      const data = await res.json();
      // normalize possible wrapped responses
      const arr = Array.isArray(data) ? data : (Array.isArray(data.value) ? data.value : (Array.isArray(data.customers) ? data.customers : []));
      setCustomers(arr);
    } catch (err) {
      setError('Failed to fetch customers');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // attach vendor id when available so vendor-created customers are linked
      const payload = vendor && vendor._id ? { ...form, vendor: vendor._id } : form;
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to add customer');
      setForm({ name: '', phone: '', address: '' });
      fetchCustomers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await fetch(`${API}/${id}`, { method: 'DELETE' });
      fetchCustomers();
    } catch {
      setError('Failed to delete customer');
    }
  }

  function handleEdit(customer) {
    setEditingId(customer._id);
    setEditForm({ name: customer.name, phone: customer.phone, address: customer.address });
  }

  async function handleSave(id) {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Failed to update customer');
      setEditingId(null);
      setEditForm({ name: '', phone: '', address: '' });
      fetchCustomers();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCancel() {
    setEditingId(null);
    setEditForm({ name: '', phone: '', address: '' });
  }

  const { start, end } = getPeriodDates(period);
  const filteredCustomers = customers.filter(item => {
    if (!item.createdAt) return false;
    const d = new Date(item.createdAt);
    return d >= start && d < end;
  });

  return (
    <div className="customer-manager-root">
      <div className="customer-manager-card">
        <h2 className="customer-manager-title">Add Customer</h2>
        <form onSubmit={handleSubmit} className="customer-manager-form">
          <input className="customer-manager-input" placeholder="Name" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input className="customer-manager-input" placeholder="Phone" value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} required />
          <input className="customer-manager-input" placeholder="Address" value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} required />
          <button type="submit" disabled={loading} className="customer-manager-btn">
            {loading ? 'Adding...' : 'Add Customer'}
          </button>
          {error && <div className="customer-manager-error">Error: {error}</div>}
        </form>
        <hr className="customer-manager-divider" />
        <div className="customer-manager-list-header">
          <h3>Customer List</h3>
          <button onClick={handleExportPDF} className="customer-manager-btn export">Export PDF</button>
        </div>
        <div className="customer-manager-filter">
          <label>Filter by period:</label>
          <select value={period} onChange={e => setPeriod(e.target.value)} className="customer-manager-select">
            <option value="all">All Customers</option>
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
          </select>
        </div>
        <ul id="customer-list" className="customer-manager-list">
          {filteredCustomers.map(c => (
            <li key={c._id} className="customer-manager-list-item">
              {editingId === c._id ? (
                <div className="customer-manager-edit-form">
                  <input
                    type="text"
                    className="customer-manager-input"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    className="customer-manager-input"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="Phone"
                  />
                  <input
                    type="text"
                    className="customer-manager-input"
                    value={editForm.address}
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="Address"
                  />
                  <div className="customer-manager-edit-buttons">
                    <button onClick={() => handleSave(c._id)} className="customer-manager-btn save">Save</button>
                    <button onClick={handleCancel} className="customer-manager-btn cancel">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <span><b>{c.name}</b> — {c.phone} — {c.address}</span>
                  <div className="customer-manager-actions">
                    <button onClick={() => handleEdit(c)} className="customer-manager-btn edit">Edit</button>
                    <button onClick={() => handleDelete(c._id)} className="customer-manager-btn delete">Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
