import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { fetchCustomerPayments } from '../api';

export default function CustomerPaymentDetails({ vendorId, customers, selectedDate, onBack }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaid, setShowPaid] = useState(false);
  const [date, setDate] = useState(selectedDate || new Date());
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Export table as PDF
  const handleExportPDF = async () => {
    const table = document.getElementById('payment-table');
    if (!table) return;
    const canvas = await html2canvas(table);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    pdf.addImage(imgData, 'PNG', 10, 10, pageWidth - 20, (canvas.height * (pageWidth - 20)) / canvas.width);
    pdf.save('customer-payments.pdf');
  };

  useEffect(() => {
    async function fetchPaymentsForDate() {
      setLoading(true);
      const isoDate = date instanceof Date ? date.toISOString().slice(0, 10) : date;
      const data = await fetchCustomerPayments({ vendorId, date: isoDate });
      setPayments(data);
      setLoading(false);
    }
    fetchPaymentsForDate();
  }, [vendorId, date]);
  useEffect(() => {
    async function fetchPayments() {
      setLoading(true);
  const res = await fetch(`${getApiBase()}/vendors/${vendorId}/customer-payments`);
      const data = await res.json();
      setPayments(data);
      setLoading(false);
    }
    fetchPayments();
  }, [vendorId]);

  // Map customerId to customer name for display
  const customerMap = {};
  const paymentMethodMap = {};
  customers.forEach(c => {
    customerMap[c._id] = c.name;
    paymentMethodMap[c._id] = (c.paymentMethod || 'monthly').toLowerCase();
  });

  // Filter payments by paid/unpaid
  // Group payments by customer and period
  // Helper to get period range
  function getPeriodRange(date, period) {
    const d = new Date(date);
    if (period === 'daily') {
      return [d, d];
    } else if (period === 'weekly') {
      const day = d.getDay();
      const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return [monday, sunday];
    } else {
      // monthly
      const first = new Date(d.getFullYear(), d.getMonth(), 1);
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return [first, last];
    }
  }

  // Build grouped payments
  const grouped = {};
  payments.forEach(p => {
    const cid = p.customer?._id || p.customer;
    const method = paymentMethodMap[cid] || 'monthly';
    const statusMatch = p.status === (showPaid ? 'paid' : 'unpaid');
    if (!date) return;
    const paymentDate = p.date ? new Date(p.date) : null;
    let inPeriod = false;
    if (paymentDate) {
      const [start, end] = getPeriodRange(date, method);
      if (method === 'daily') {
        inPeriod = paymentDate.toDateString() === start.toDateString();
      } else {
        inPeriod = paymentDate >= start && paymentDate <= end;
      }
    }
    if (statusMatch && inPeriod) {
      if (!grouped[cid]) {
        grouped[cid] = {
          name: customerMap[cid] || '—',
          liters: 0,
          total: 0,
          method,
          status: p.status,
          details: []
        };
      }
      grouped[cid].liters += Number(p.quantity || p.liters || 0);
      grouped[cid].total += Number(p.total || 0);
      grouped[cid].details.push({
        date: p.date,
        liters: Number(p.quantity || p.liters || 0),
        cost: Number(p.total || 0)
      });
    }
  });
  const groupedList = Object.values(grouped);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h2>Customer Payment Details</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <button onClick={() => setShowPaid(false)} style={{ background: !showPaid ? '#fda085' : '#fff', color: !showPaid ? '#fff' : '#fda085', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, marginRight: 8 }}>Unpaid</button>
        <button onClick={() => setShowPaid(true)} style={{ background: showPaid ? '#fda085' : '#fff', color: showPaid ? '#fff' : '#fda085', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600 }}>Paid</button>
        <input
          type="date"
          value={date instanceof Date ? date.toISOString().slice(0, 10) : date}
          onChange={e => setDate(new Date(e.target.value))}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #eee', fontSize: 16 }}
        />
      </div>
      {loading ? <div>Loading...</div> : (
        <>
          <button onClick={handleExportPDF} style={{ marginBottom: 16, background: '#fda085', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>Export PDF</button>
          <table id="payment-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12 }}>
            <thead>
              <tr style={{ background: '#fda085', color: '#fff' }}>
                <th style={{ padding: 8 }}>Customer</th>
                <th style={{ padding: 8 }}>Liters</th>
                <th style={{ padding: 8 }}>Amount</th>
                <th style={{ padding: 8 }}>Payment Method</th>
                <th style={{ padding: 8 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {groupedList.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: 16 }}>No {showPaid ? 'paid' : 'unpaid'} payments found.</td></tr>
              )}
              {groupedList.map((c, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => setSelectedCustomer(selectedCustomer === idx ? null : idx)}>
                  <td style={{ padding: 8 }}>{c.name}</td>
                  <td style={{ padding: 8 }}>{c.liters.toFixed(2)}</td>
                  <td style={{ padding: 8 }}>{c.total}</td>
                  <td style={{ padding: 8 }}>{c.method.charAt(0).toUpperCase() + c.method.slice(1)}</td>
                  <td style={{ padding: 8 }}>{c.status}</td>
                </tr>
              ))}
              {/* Show total amount for selected payment method only */}
              {groupedList.length > 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700, padding: 12, color: '#222' }}>
                    Total {groupedList[0].method.charAt(0).toUpperCase() + groupedList[0].method.slice(1)} Amount: ₹{groupedList.reduce((sum, c) => sum + c.total, 0)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Customer details card */}
          {selectedCustomer !== null && groupedList[selectedCustomer] && (
            <div style={{ margin: '32px auto', maxWidth: 400, background: '#fff7e6', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: 24 }}>
              <h3 style={{ color: '#fda085', marginBottom: 12 }}>{groupedList[selectedCustomer].name} - Details</h3>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Payment Method: {groupedList[selectedCustomer].method.charAt(0).toUpperCase() + groupedList[selectedCustomer].method.slice(1)}</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Status: {groupedList[selectedCustomer].status}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead>
                  <tr style={{ background: '#fda085', color: '#fff' }}>
                    <th style={{ padding: 6 }}>Date</th>
                    <th style={{ padding: 6 }}>Liters</th>
                    <th style={{ padding: 6 }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedList[selectedCustomer].details.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 6 }}>{d.date ? new Date(d.date).toLocaleDateString() : '-'}</td>
                      <td style={{ padding: 6 }}>{d.liters.toFixed(2)}</td>
                      <td style={{ padding: 6 }}>₹{d.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => setSelectedCustomer(null)} style={{ marginTop: 16, background: '#fda085', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          )}
        </>
      )}
      {/* Back button removed; handled by main dashboard */}
    </div>
  );
}
