import React, { useState } from 'react';

export default function MilkPaymentCard({ item, customerName, updateMilk, fetchMilk, setMilk }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(item.paymentStatus || 'unpaid');

  function handlePrintBill() {
    const billHtml = `
      <div style='font-family: Arial; padding: 24px;'>
        <h2>Milk Payment Bill</h2>
        <hr />
        <div><strong>Customer:</strong> ${customerName}</div>
        <div><strong>Session:</strong> ${item.session}</div>
        <div><strong>Liter:</strong> ${item.liter}</div>
        <div><strong>Date:</strong> ${item.date ? item.date.split('T')[0] : ''}</div>
        <div><strong>Price:</strong> ₹${item.price}</div>
        <div><strong>Payment Status:</strong> ${status}</div>
        <hr />
        <div style='margin-top:16px;'>Thank you!</div>
      </div>
    `;
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`<html><head><title>Print Bill</title></head><body>${billHtml}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function handleSaveStatus() {
    await updateMilk(item._id, { paymentStatus: status });
    fetchMilk().then(res => setMilk(res.milk || []));
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 16, cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
      <div><strong>{customerName}</strong></div>
      <div>Session: {item.session}</div>
      <div>Liter: {item.liter}</div>
      <div>Status: {status.charAt(0).toUpperCase() + status.slice(1)}</div>
      {expanded && (
        <div style={{ marginTop: 12, background: '#f0f8ff', borderRadius: 8, padding: 12 }}>
          <div>Date: {item.date ? item.date.split('T')[0] : ''}</div>
          <div>Price: ₹{item.price}</div>
          <div>
            <label>Payment Status: </label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <button onClick={e => {e.stopPropagation(); handleSaveStatus();}} style={{ marginLeft: 8 }}>Save</button>
          </div>
          <button onClick={e => {e.stopPropagation(); handlePrintBill();}} style={{ background: '#2196f3', color: '#fff', border: 'none', marginTop: 8 }}>Print Bill</button>
        </div>
      )}
    </div>
  );
}