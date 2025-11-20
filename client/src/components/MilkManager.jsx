import React, { useEffect, useState } from 'react';
import './MilkManager.css';
import { fetchMilk, addMilk, updateMilk, deleteMilk } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { getApiBase } from '../api.js';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Debugging logs to identify undefined variables
console.log('Debugging MilkManager.jsx');
console.log('Imported modules:', { fetchMilk, addMilk, updateMilk, deleteMilk, useAuth, getApiBase });

// Get today's date in yyyy-mm-dd format (must be before any useState)
const today = new Date().toISOString().split('T')[0];

import { generateBill, shareBill } from './generateAndShareBill.js';

const MilkManager = ({ vendor: vendorProp }) => {
  const { vendor: vendorCtx } = useAuth();
  const vendor = vendorProp || vendorCtx;
  // Periodic/date/session filter states
  const [period, setPeriod] = useState('daily');
  const [filterDate, setFilterDate] = useState(today);
  const [filterSession, setFilterSession] = useState('all');
  // Menu visibility is controlled at App level; no direct DOM manipulation required here.
  const [milk, setMilk] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customer: '', session: 'morning', liter: '', price: '', date: today });
  const [editing, setEditing] = useState(null);
  const [milkPrice, setMilkPrice] = useState('');
  const [page, setPage] = useState('entry');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [generatedPdf, setGeneratedPdf] = useState(null);

  useEffect(() => {
    console.log('[MilkManager] vendor:', vendor);
    console.log('[MilkManager] vendor._id:', vendor ? vendor._id : null);

    const vendorId = vendor && vendor._id ? vendor._id : null;
    fetchMilk(vendorId).then(res => {
      console.log('[MilkManager] fetched milk data:', res);
      setMilk(Array.isArray(res) ? res : (Array.isArray(res.milk) ? res.milk : []));
    }).catch(err => {
      console.error('[MilkManager] failed to fetch milk data:', err);
    });

    if (vendor && vendor._id) {
      fetch(`${getApiBase()}/vendors/${vendor._id}/customers`)
        .then(res => res.json())
        .then(res => {
          console.log('[MilkManager] fetched customers:', res);
          setCustomers(Array.isArray(res) ? res : []);
        })
        .catch(err => {
          console.error('[MilkManager] failed to fetch customers', err);
          setCustomers([]);
        });
    } else {
      setCustomers([]);
    }

    console.log('[MilkManager] Initializing vendor price fetch...');

    if (vendor && vendor._id) {
      fetch(`${getApiBase()}/vendors/${vendor._id}/price`)
        .then(res => {
          console.log('[MilkManager] Vendor price fetch response status:', res.status);
          if (!res.ok) {
            console.error('[MilkManager] Failed to fetch vendor price. Status:', res.status);
            throw new Error('Failed to fetch vendor price');
          }
          return res.json();
        })
        .then(data => {
          console.log('[MilkManager] Vendor price data:', data);
          if (data && typeof data.defaultMilkPrice === 'number') {
            setMilkPrice(String(data.defaultMilkPrice));
          } else {
            console.warn('[MilkManager] Invalid vendor price data, falling back to localStorage.');
            const savedPrice = localStorage.getItem('milkPrice');
            if (savedPrice) setMilkPrice(savedPrice);
          }
        })
        .catch(err => {
          console.error('[MilkManager] Error fetching vendor price:', err);
          const savedPrice = localStorage.getItem('milkPrice');
          console.warn('[MilkManager] Fallback to localStorage price due to error:', savedPrice);
          if (savedPrice) setMilkPrice(savedPrice);
        });
    } else {
      console.warn('[MilkManager] No vendor ID provided, falling back to localStorage price.');
      const savedPrice = localStorage.getItem('milkPrice');
      if (savedPrice) setMilkPrice(savedPrice);
    }

    console.log('[MilkManager] Fetching milk data...');
    fetchMilk(vendor && vendor._id ? vendor._id : null)
      .then(res => {
        console.log('[MilkManager] Milk data fetched:', res);
        setMilk(Array.isArray(res) ? res : (Array.isArray(res.milk) ? res.milk : []));
      })
      .catch(err => {
        console.error('[MilkManager] Failed to fetch milk data:', err);
      });
  }, [vendor]);

  useEffect(() => {
    console.log('[MilkManager] form.liter:', form.liter);
    console.log('[MilkManager] milkPrice:', milkPrice);

    if (editing) return;
    if (form.liter && milkPrice) {
      setForm(f => ({ ...f, price: (parseFloat(f.liter) * parseFloat(milkPrice)).toFixed(2) }));
    }
  }, [form.liter, milkPrice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer || !form.session || !form.price) {
      alert('Please fill all fields.');
      return;
    }
    // Prevent saving with session 'all'
    const saveForm = { ...form, session: form.session === 'all' ? 'morning' : form.session };
    if (editing) {
      await updateMilk(editing, saveForm);
    } else {
      // attach vendor/supplier id when available so entries are scoped to the vendor
      const payload = vendor && vendor._id ? { ...saveForm, vendor: vendor._id } : saveForm;
      await addMilk(payload);
    }
    setForm({ customer: '', session: 'morning', liter: '', price: '', date: today });
    setEditing(null);
    fetchMilk(vendor && vendor._id ? vendor._id : null).then(res => {
      setMilk(Array.isArray(res) ? res : (Array.isArray(res.milk) ? res.milk : []));
    });
  };

  const handleEdit = (item) => {
    setForm({
      customer: typeof item.customer === 'object' ? item.customer._id : item.customer,
      session: item.session,
      liter: item.liter,
      price: item.price,
      date: item.date ? item.date.split('T')[0] : today
    });
    setEditing(item._id);
  };

  const handleDelete = async (id) => {
    await deleteMilk(id);
    fetchMilk(vendor && vendor._id ? vendor._id : null).then(res => {
      setMilk(Array.isArray(res) ? res : (Array.isArray(res.milk) ? res.milk : []));
    });
  };

  const handleSavePrice = () => {
    // Persist vendor default price if vendor available, else localStorage
    if (vendor && vendor._id) {
      fetch(`${getApiBase()}/vendors/${vendor._id}/price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultMilkPrice: Number(milkPrice) })
      }).then(res => {
        if (!res.ok) throw new Error('Failed to save vendor price');
        return res.json();
      }).then(() => {
        alert('Vendor default milk price saved');
      }).catch(err => {
        console.error('Failed to save vendor price', err);
        localStorage.setItem('milkPrice', milkPrice);
        alert('Saved locally (server unavailable)');
      });
    } else {
      localStorage.setItem('milkPrice', milkPrice);
      alert('Milk price saved locally');
    }
  };

  // Calculate totals
  const morningTotal = milk.filter(m => m.session === 'morning').reduce((sum, m) => sum + Number(m.liter || 0), 0);
  const eveningTotal = milk.filter(m => m.session === 'evening').reduce((sum, m) => sum + Number(m.liter || 0), 0);
  const grandTotal = morningTotal + eveningTotal;

  // Debugging logs for total cost and vendor milk price
  console.log('Milk data:', milk);
  console.log('Vendor milk price:', milkPrice);

  // Ensure calculations handle edge cases
  const totalCost = milk.reduce((sum, m) => sum + (Number(m.price) || 0), 0);
  const vendorMilkPrice = Number(milkPrice) || 0;

  console.log('Total cost:', totalCost);
  console.log('Vendor milk price:', vendorMilkPrice);

  const handleShareOnWhatsApp = async () => {
    // Generate the PDF and upload it to the server
    setIsUploading(true);
    try {
      const pdfBlob = await generateBillPDF(selectedCustomer, milk, period, filterDate, filterSession, milkPrice);
      const formData = new FormData();
      formData.append('file', pdfBlob, 'bill.pdf');
      formData.append('customerId', selectedCustomer._id);
      formData.append('vendorId', vendor && vendor._id ? vendor._id : '');
      // Upload PDF to server
      const uploadRes = await fetch(`${process.env.REACT_APP_API_URL || ''}/milk/upload-bill`, {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Failed to upload bill');
  const { filename } = await uploadRes.json();
  // Use the new download link for mobile compatibility
  const downloadUrl = `${process.env.REACT_APP_API_URL || ''}/milk/download/${filename}`;
  const phone = selectedCustomer.phone || '';
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(downloadUrl)}`;
  window.open(waUrl, '_blank');
    } catch (err) {
      alert('Failed to share bill on WhatsApp.');
    } finally {
      setIsUploading(false);
    }
// Generate a PDF bill for the selected customer and period
function generateBillPDF(customer, milkEntries, period, filterDate, filterSession, milkPrice) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Milk Bill', 14, 16);
  doc.setFontSize(12);
  doc.text(`Customer: ${customer.name || ''}`, 14, 26);
  doc.text(`Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`, 14, 34);
  if (filterDate) doc.text(`Date: ${filterDate}`, 14, 42);
  if (filterSession && filterSession !== 'all') doc.text(`Session: ${filterSession}`, 14, 50);

  // Filter milk entries for this customer and period
  const entries = milkEntries.filter(m => {
    if (!m.customer || (typeof m.customer === 'object' ? m.customer._id : m.customer) !== customer._id) return false;
    if (filterSession !== 'all' && m.session !== filterSession) return false;
    if (period === 'custom' && filterDate) {
      return m.date && m.date.split('T')[0] === filterDate;
    }
    // Add more period logic if needed
    return true;
  });

  // Table data
  const tableData = entries.map(m => [
    m.date ? m.date.split('T')[0] : '',
    m.session,
    m.liter,
    m.price
  ]);

  autoTable(doc, {
    head: [['Date', 'Session', 'Liter', 'Price']],
    body: tableData,
    startY: 60,
  });

  // Grand total
  const total = entries.reduce((sum, m) => sum + (Number(m.price) || 0), 0);
  doc.text(`Grand Total: ₹${total}`, 14, doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 80);

  return doc.output('blob');
}
  };

  return (
    <div className="milk-manager-wrapper">
      <div className="milk-manager-header">
        <button onClick={() => setPage('entry')}>Milk Entry</button>
        <button onClick={() => setPage('payment')}>Milk Payment</button>
      </div>
      {page === 'entry' ? (
        <div>
          <div className="milk-manager-controls">
            <input type="number" value={milkPrice} onChange={e => setMilkPrice(e.target.value)} placeholder="Milk Price" />
            <button onClick={handleSavePrice}>Save</button>
          </div>
          <form onSubmit={handleSubmit} className="milk-manager-form">
            <select value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}>
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <select value={form.session} onChange={e => setForm(f => ({ ...f, session: e.target.value }))}>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
            </select>
            <input type="number" value={form.liter} onChange={e => setForm(f => ({ ...f, liter: e.target.value }))} placeholder="Liter" />
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Price" />
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <button type="submit">{editing ? 'Update' : 'Save'}</button>
          </form>
          {/* Period, date, session filter controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', margin: '16px 0' }}>
            <label htmlFor="period">Period:</label>
            <select id="period" value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom Date</option>
            </select>
            {period === 'custom' && (
              <>
                <label htmlFor="filterDate">Date:</label>
                <input id="filterDate" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              </>
            )}
            <label htmlFor="filterSession">Session:</label>
            <select id="filterSession" value={filterSession} onChange={e => setFilterSession(e.target.value)}>
              <option value="all">All Sessions</option>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
            </select>
          </div>
          {/* Filtered milk table */}
          <div className="milk-card">
            <table className="milk-manager-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Session</th>
                  <th>Liter</th>
                  <th>Price</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {milk.filter(item => {
                  // Period/date/session filter logic
                  let match = true;
                  // Session
                  if (filterSession !== 'all' && item.session !== filterSession) match = false;
                  // Date/period
                  const entryDate = item.date ? item.date.split('T')[0] : '';
                  const entryDateObj = new Date(entryDate);
                  const filterDateObj = new Date(filterDate);
                  if (period === 'custom') {
                    if (entryDate !== filterDate) match = false;
                  } else if (period === 'daily') {
                    if (entryDate !== today) match = false;
                  } else if (period === 'weekly') {
                    // Week range
                    const day = filterDateObj.getDay();
                    const weekStart = new Date(filterDateObj);
                    weekStart.setDate(filterDateObj.getDate() - day);
                    weekStart.setHours(0,0,0,0);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    weekEnd.setHours(23,59,59,999);
                    if (!(entryDateObj >= weekStart && entryDateObj <= weekEnd)) match = false;
                  } else if (period === 'monthly') {
                    // Ensure the object is a valid Date instance
                    if (filterDateObj instanceof Date && !isNaN(filterDateObj)) {
                      if (entryDateObj.getFullYear() !== filterDateObj.getFullYear() || entryDateObj.getMonth() !== filterDateObj.getMonth()) {
                        match = false;
                      }
                    } else {
                      console.error('Invalid Date object:', filterDateObj);
                      match = false;
                    }
                  } else if (period === 'yearly') {
                    if (entryDateObj.getFullYear() !== filterDateObj.getFullYear()) match = false;
                  }
                  return match;
                }).map(item => (
                  <tr key={item._id}>
                    <td>{typeof item.customer === 'object' ? item.customer.name : customers.find(c => c._id === item.customer)?.name || item.customer}</td>
                    <td>{item.session}</td>
                    <td>{item.liter}</td>
                    <td>{item.price}</td>
                    <td>{item.date ? item.date.split('T')[0] : ''}</td>
                    <td>
                      <button onClick={() => handleEdit(item)}>Edit</button>
                      <button onClick={() => handleDelete(item._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="milk-manager-summary">
              Morning Total: {morningTotal} | Evening Total: {eveningTotal} | Grand Total: {grandTotal}
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Payment Filter Controls with Period Selection */}
          <div className="milk-card" style={{marginBottom: 24, padding: 16, border: '2px solid #2196f3', borderRadius: 10, background: '#f0f7ff'}}>
            <div className="milk-manager-payment-controls" style={{display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center'}}>
              <select value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}>
                <option value="">All Customers</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <label htmlFor="paymentPeriod">Period:</label>
              <select id="paymentPeriod" value={form.period || 'daily'} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Date</option>
              </select>
              {(form.period === 'custom' || form.period === undefined) && (
                <>
                  <label htmlFor="paymentDate">Date:</label>
                  <input id="paymentDate" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </>
              )}
              <select value={form.session || 'all'} onChange={e => setForm(f => ({ ...f, session: e.target.value }))}>
                <option value="all">All Sessions</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </select>
            </div>
          </div>
          {/* Customer Cards */}
          <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
            {(() => {
              // Filter logic
              const filterDate = form.date;
              const filterSession = form.session || 'all';
              const filterCustomer = form.customer;
              const filterPeriod = form.period || 'daily';
              const filterDateObj = new Date(filterDate);
              // Add debugging logs to inspect filterDateObj and reportDateObj
              console.log('filterDateObj:', filterDateObj);
              let filtered = milk.filter(item => {
                if (filterCustomer && (typeof item.customer === 'object' ? item.customer._id : item.customer) !== filterCustomer) return false;
                if (filterSession !== 'all' && item.session !== filterSession) return false;
                const entryDate = item.date ? item.date.split('T')[0] : '';
                const entryDateObj = new Date(entryDate);
                let dateMatch = false;
                if (filterPeriod === 'custom') {
                  dateMatch = entryDate === filterDate;
                } else if (filterPeriod === 'daily') {
                  dateMatch = entryDate === filterDate;
                } else if (filterPeriod === 'weekly') {
                  const day = filterDateObj.getDay();
                  const weekStart = new Date(filterDateObj);
                  weekStart.setDate(filterDateObj.getDate() - day);
                  weekStart.setHours(0,0,0,0);
                  const weekEnd = new Date(weekStart);
                  weekEnd.setDate(weekStart.getDate() + 6);
                  weekEnd.setHours(23,59,59,999);
                  dateMatch = entryDateObj >= weekStart && entryDateObj <= weekEnd;
                } else if (filterPeriod === 'monthly') {
                  // Ensure the object is a valid Date instance
                  if (filterDateObj instanceof Date && !isNaN(filterDateObj)) {
                    dateMatch = entryDateObj.getFullYear() === filterDateObj.getFullYear() && entryDateObj.getMonth() === filterDateObj.getMonth();
                  } else {
                    console.error('Invalid Date object:', filterDateObj);
                    dateMatch = false;
                  }
                } else if (filterPeriod === 'yearly') {
                  dateMatch = entryDateObj.getFullYear() === filterDateObj.getFullYear();
                }
                return dateMatch;
              });
              // Group by customer
              const grouped = {};
              filtered.forEach(item => {
                const custId = typeof item.customer === 'object' ? item.customer._id : item.customer;
                const custName = typeof item.customer === 'object' ? item.customer.name : customers.find(c => c._id === item.customer)?.name || item.customer;
                if (!grouped[custId]) grouped[custId] = { name: custName, sessions: [] };
                grouped[custId].sessions.push(item);
              });
              return Object.entries(grouped).map(([custId, group]) => {
                const grandTotal = group.sessions.reduce((sum, s) => sum + Number(s.price || 0), 0);
                // Week number and month details
                let periodDetail = null;
                if (filterPeriod === 'weekly') {
                  // ISO week number and week range
                  const getWeekNumber = (date) => {
                    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                    const dayNum = d.getUTCDay() || 7;
                    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
                    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
                  };
                  const weekNum = getWeekNumber(filterDateObj);
                  // Start of week (Monday)
                  const startOfWeek = new Date(filterDateObj);
                  const day = startOfWeek.getDay();
                  const diffToMonday = (day === 0 ? -6 : 1) - day;
                  startOfWeek.setDate(filterDateObj.getDate() + diffToMonday);
                  // End of week (Sunday)
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);
                  const fmt = d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' });
                  periodDetail = (
                    <div style={{fontWeight: 500, color: '#444', fontSize: 15, marginBottom: 6}}>
                      <div>Week Number : <b>{weekNum}</b></div>
                      <div>Start of Week : <b>{fmt(startOfWeek)}</b></div>
                      <div>End of Week : <b>{fmt(endOfWeek)}</b></div>
                    </div>
                  );
                } else if (filterPeriod === 'monthly') {
                  const monthName = filterDateObj.toLocaleString('default', { month: 'long' });
                  periodDetail = (
                    <div style={{fontWeight: 500, color: '#1976d2', fontSize: 15, marginBottom: 6}}>
                      {monthName} {filterDateObj.getFullYear()}
                    </div>
                  );
                }
                // Get customer phone number
                let customerPhone = '';
                if (group.sessions.length > 0) {
                  const custObj = typeof group.sessions[0].customer === 'object' ? group.sessions[0].customer : customers.find(c => c._id === group.sessions[0].customer);
                  customerPhone = custObj && custObj.phone ? custObj.phone : '';
                }
                return (
                  <div key={custId} id={`bill-card-${custId}`} className="milk-bill-card" style={{background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px #eee'}}>
                    <div style={{display: 'flex', gap: 8, marginBottom: 12}}>
                      <button style={{background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold'}} onClick={async () => {
                        // Download Bill as PNG logic
                        const billElement = document.getElementById(`bill-card-${custId}`);
                        if (!billElement) {
                          alert('Bill section not found.');
                          return;
                        }
                        const canvas = await html2canvas(billElement);
                        const imgData = canvas.toDataURL('image/png');
                        const link = document.createElement('a');
                        link.href = imgData;
                        link.download = 'bill.png';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}>
                        Download Bill as PNG
                      </button>
                    </div>
                    <div style={{fontWeight: 'bold', color: '#f48c8c', fontSize: 18, marginBottom: 4}}> {group.name} </div>
                    {periodDetail}
                    <div style={{ marginBottom: 4, color: '#444', fontSize: 14 }}>
                      <span>Phone: {customerPhone || 'N/A'}</span>
                    </div>
                    <div style={{marginBottom: 8}}>
                      {group.sessions.map(s => (
                        <div key={s._id}>
                          Session: {s.session}, Liter: {s.liter}, Status: {s.paymentStatus || 'unpaid'}
                        </div>
                      ))}
                    </div>
                    <div style={{fontWeight: 'bold', marginBottom: 8}}>Grand Total: ₹{grandTotal}</div>
                    <div className="milk-card-table-wrapper">
                      <table className="milk-card-table">
                        <thead>
                          <tr>
                            <th>Session</th>
                            <th>Liter</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.sessions.map(s => (
                            <tr key={s._id}>
                              <td>{s.session}</td>
                              <td>{s.liter}</td>
                              <td>₹{s.price}</td>
                              <td>{s.paymentStatus === 'paid' ? <span style={{color: 'green'}}>✔️</span> : <span style={{color: 'red'}}>❌</span>}</td>
                              <td className="milk-card-actions">
                                {editing === s._id ? (
                                  <>
                                    <button className="edit-btn" onClick={async () => {
                                      await updateMilk(s._id, form);
                                      setEditing(null);
                                      setForm({ customer: '', session: 'morning', liter: '', price: '', date: today });
                                      fetchMilk(vendor && vendor._id ? vendor._id : null).then(res => {
                                        setMilk(Array.isArray(res) ? res : (Array.isArray(res.milk) ? res.milk : []));
                                      });
                                    }}>Save</button>
                                    {s.paymentStatus !== 'paid' && (
                                      <button className="paid-btn" onClick={async () => {
                                        await updateMilk(s._id, { ...s, paymentStatus: 'paid' });
                                        fetchMilk(vendor && vendor._id ? vendor._id : null).then(res => {
                                          setMilk(Array.isArray(res) ? res : (Array.isArray(res.milk) ? res.milk : []));
                                        });
                                      }}>Mark as Paid</button>
                                    )}
                                    {s.paymentStatus === 'paid' && (
                                      <button className="paid-btn" style={{background:'#ff9800'}} onClick={async () => {
                                        await updateMilk(s._id, { ...s, paymentStatus: 'unpaid' });
                                        fetchMilk(vendor && vendor._id ? vendor._id : null).then(res => {
                                          setMilk(Array.isArray(res) ? res : (Array.isArray(res.milk) ? res.milk : []));
                                        });
                                      }}>Mark as Unpaid</button>
                                    )}
                                    <button className="delete-btn" onClick={() => { setEditing(null); setForm({ customer: '', session: 'morning', liter: '', price: '', date: today }); }}>Cancel</button>
                                  </>
                                ) : (
                                  <>
                                    <button className="edit-btn" onClick={() => {
                                      setForm({
                                        customer: typeof s.customer === 'object' ? s.customer._id : s.customer,
                                        session: s.session,
                                        liter: s.liter,
                                        price: s.price,
                                        date: s.date ? s.date.split('T')[0] : today
                                      });
                                      setEditing(s._id);
                                    }}>Edit</button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="milk-card-total">Grand Total: ₹{grandTotal}</div>
                    </div>
                    <div style={{display: 'flex', gap: 8, marginTop: 12}}>
                      <button style={{background: '#007BFF', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold', marginRight: '10px'}} onClick={async () => {
                        const pdfFile = await generateBill(group, grandTotal);
                        setGeneratedPdf(pdfFile);
                        alert('Bill generated successfully!');
                      }}>
                        Generate Bill
                      </button>
                      <button style={{background: '#25D366', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold'}} onClick={() => {
                        const customer = customers.find(c => c._id === custId);
                        shareBill(generatedPdf, customer, vendor);
                      }}>
                        Share Bill on WhatsApp
                      </button>
                      <button style={{background: '#FF9800', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 'bold'}} onClick={async () => {
                        // Download Bill logic
                        if (!generatedPdf) {
                          alert('Please generate the bill first.');
                          return;
                        }
                        const blobUrl = window.URL.createObjectURL(generatedPdf);
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = 'bill.pdf';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(blobUrl);
                      }}>
                        Download Bill
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          {/* Payment Report for All Customers */}
          <div className="milk-card milk-manager-payment-report-container" style={{marginTop: 32, padding: 12, border: '2px solid #90caf9', borderRadius: 10, background: '#f7fbff', maxWidth: '99vw', overflowX: 'auto'}}>
            <h3 style={{color: '#1976d2', marginBottom: 10, fontSize: 18, textAlign: 'center'}}>Payment Report (All Customers)</h3>
            <div className="milk-manager-payment-controls" style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, justifyContent: 'center', alignItems: 'center'}}>
              {/* Customer Selection */}
              <select 
                value={form.reportCustomer || 'all'} 
                onChange={e => setForm(f => ({ ...f, reportCustomer: e.target.value }))} 
                style={{minWidth: 120, fontSize: 14, padding: 6, borderRadius: 4, border: '1px solid #ccc'}}
              >
                <option value="all">All Customers</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              
              <input 
                type="date" 
                value={form.reportDate || form.date} 
                onChange={e => setForm(f => ({ ...f, reportDate: e.target.value }))} 
                style={{minWidth: 120, fontSize: 14, padding: 6, borderRadius: 4, border: '1px solid #ccc'}} 
              />
              
              <select 
                value={form.reportPeriod || 'daily'} 
                onChange={e => setForm(f => ({ ...f, reportPeriod: e.target.value }))} 
                style={{minWidth: 110, fontSize: 14, padding: 6, borderRadius: 4, border: '1px solid #ccc'}}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              
              <select 
                value={form.reportSession || 'all'} 
                onChange={e => setForm(f => ({ ...f, reportSession: e.target.value }))} 
                style={{minWidth: 110, fontSize: 14, padding: 6, borderRadius: 4, border: '1px solid #ccc'}}
              >
                <option value="all">All Sessions</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </select>
              
              {/* Print Button */}
              <button 
                style={{background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 'bold', fontSize: 14}}
                onClick={() => {
                  const printContainer = document.querySelector('.milk-manager-payment-report-container');
                  if (!printContainer) {
                    alert('Report container not found');
                    return;
                  }
                  
                  // Create a new window for printing
                  const printWindow = window.open('', '', 'width=800,height=600');
                  const printContent = printContainer.innerHTML;
                  
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Payment Report</title>
                        <style>
                          body { font-family: Arial, sans-serif; margin: 20px; }
                          h3 { color: #1976d2; text-align: center; margin-bottom: 20px; }
                          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                          th, td { border: 1px solid #333; padding: 10px; text-align: left; }
                          th { background: #f0f0f0; font-weight: bold; }
                          tr { page-break-inside: avoid; }
                          @media print {
                            body { margin: 10px; }
                          }
                        </style>
                      </head>
                      <body>
                        ${printContent}
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  
                  // Wait for content to load, then print
                  setTimeout(() => {
                    printWindow.print();
                  }, 250);
                }}
              >
                Print Report
              </button>
              
              {/* Export Report Button */}
              <button 
                style={{background: '#2196f3', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 'bold', fontSize: 14}} 
                onClick={() => {
                  import('jspdf').then(jsPDF => {
                    const doc = new jsPDF.default({orientation: 'landscape'});
                    let reportDate = form.reportDate || form.date;
                    let reportSession = form.reportSession || 'all';
                    let reportPeriod = form.reportPeriod || 'daily';
                    let reportCustomer = form.reportCustomer || 'all';
                    let reportDateObj = new Date(reportDate);
                    let filtered = milk.filter(item => {
                      if (reportSession !== 'all' && item.session !== reportSession) return false;
                      if (reportCustomer !== 'all') {
                        const itemCustomerId = typeof item.customer === 'object' ? item.customer._id : item.customer;
                        if (itemCustomerId !== reportCustomer) return false;
                      }
                      const entryDate = item.date ? item.date.split('T')[0] : '';
                      const entryDateObj = new Date(entryDate);
                      let dateMatch = false;
                      if (reportPeriod === 'daily') {
                        dateMatch = entryDate === reportDate;
                      } else if (reportPeriod === 'weekly') {
                        const day = reportDateObj.getDay();
                        const weekStart = new Date(reportDateObj);
                        weekStart.setDate(reportDateObj.getDate() - day);
                        weekStart.setHours(0,0,0,0);
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 6);
                        weekEnd.setHours(23,59,59,999);
                        dateMatch = entryDateObj >= weekStart && entryDateObj <= weekEnd;
                      } else if (reportPeriod === 'monthly') {
                        if (!(reportDateObj instanceof Date) || isNaN(reportDateObj)) {
                          console.error('Invalid reportDateObj:', reportDateObj);
                          dateMatch = false;
                        } else {
                          dateMatch = entryDateObj.getFullYear() === reportDateObj.getFullYear() && entryDateObj.getMonth() === reportDateObj.getMonth();
                        }
                      }
                      return dateMatch;
                    });
                    let html = `<h3>Payment Report (All Customers)</h3><table border='1' style='border-collapse:collapse;font-size:12px;'><thead><tr><th>Customer</th><th>Session</th><th>Liter</th><th>Price</th><th>Date</th><th>Status</th></tr></thead><tbody>`;
                    html += filtered.map(item => `<tr><td>${typeof item.customer === 'object' ? item.customer.name : (customers.find(c => c._id === item.customer)?.name || item.customer)}</td><td>${item.session}</td><td>${item.liter}</td><td>₹${item.price}</td><td>${item.date ? item.date.split('T')[0] : ''}</td><td>${item.paymentStatus === 'paid' ? '✔️' : '❌'}</td></tr>`).join('');
                    html += '</tbody></table>';
                    const el = document.createElement('div');
                    el.innerHTML = html;
                    doc.html(el, {
                      callback: function (doc) {
                        doc.save('Payment-Report.pdf');
                      },
                      x: 10,
                      y: 10
                    });
                  });
                }}
              >
                Export PDF
              </button>
            </div>
            <div style={{overflowX: 'auto'}}>
              <table className="milk-manager-table" style={{minWidth: 500}}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Session</th>
                    <th>Liter</th>
                    <th>Price</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Use report selectors for this table
                    const reportDate = form.reportDate || form.date;
                    const reportSession = form.reportSession || 'all';
                    const reportPeriod = form.reportPeriod || 'daily';
                    const reportCustomer = form.reportCustomer || 'all';
                    const reportDateObj = new Date(reportDate);
                    let filtered = milk.filter(item => {
                      if (reportSession !== 'all' && item.session !== reportSession) return false;
                      if (reportCustomer !== 'all') {
                        const itemCustomerId = typeof item.customer === 'object' ? item.customer._id : item.customer;
                        if (itemCustomerId !== reportCustomer) return false;
                      }
                      const entryDate = item.date ? item.date.split('T')[0] : '';
                      const entryDateObj = new Date(entryDate);
                      let dateMatch = false;
                      if (reportPeriod === 'daily') {
                        dateMatch = entryDate === reportDate;
                      } else if (reportPeriod === 'weekly') {
                        const day = reportDateObj.getDay();
                        const weekStart = new Date(reportDateObj);
                        weekStart.setDate(reportDateObj.getDate() - day);
                        weekStart.setHours(0,0,0,0);
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 6);
                        weekEnd.setHours(23,59,59,999);
                        dateMatch = entryDateObj >= weekStart && entryDateObj <= weekEnd;
                      } else if (reportPeriod === 'monthly') {
                        // Ensure reportDateObj is a valid Date instance
                        if (!(reportDateObj instanceof Date) || isNaN(reportDateObj)) {
                          console.error('Invalid reportDateObj:', reportDateObj);
                          dateMatch = false;
                        } else {
                          dateMatch = entryDateObj.getFullYear() === reportDateObj.getFullYear() && entryDateObj.getMonth() === reportDateObj.getMonth();
                        }
                      }
                      return dateMatch;
                    });
                    
                    // Calculate totals
                    const totalLiters = filtered.reduce((sum, item) => sum + Number(item.liter || 0), 0);
                    const totalCost = filtered.reduce((sum, item) => sum + Number(item.price || 0), 0);
                    const totalDays = new Set(filtered.map(item => item.date ? item.date.split('T')[0] : '')).size;
                    
                    return (
                      <>
                        {filtered.map(item => (
                          <tr key={item._id}>
                            <td>{typeof item.customer === 'object' ? item.customer.name : customers.find(c => c._id === item.customer)?.name || item.customer}</td>
                            <td>{item.session}</td>
                            <td>{item.liter}</td>
                            <td>₹{item.price}</td>
                            <td>{item.date ? item.date.split('T')[0] : ''}</td>
                            <td>{item.paymentStatus === 'paid' ? <span style={{color: 'green'}}>✔️</span> : <span style={{color: 'red'}}>❌</span>}</td>
                          </tr>
                        ))}
                        {/* Totals Row */}
                        {filtered.length > 0 && (
                          <tr style={{background: '#e8f5e9', fontWeight: 'bold', borderTop: '2px solid #2196f3'}}>
                            <td colSpan="2" style={{textAlign: 'right', paddingRight: 12}}>Grand Total:</td>
                            <td>{totalLiters.toFixed(2)} L</td>
                            <td>₹{totalCost.toFixed(2)}</td>
                            <td>{totalDays} day(s)</td>
                            <td></td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add a catch-all error handler
window.onerror = function (message, source, lineno, colno, error) {
  console.error('Global error caught:', { message, source, lineno, colno, error });
};

export default MilkManager;

