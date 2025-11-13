import React, { useState } from 'react';
import { updateMilk } from '../api';

export default function MilkPaymentGroupCard({ customerName, sessions }) {
  const [expanded, setExpanded] = useState(false);
  // Calculate grand total
  const grandTotal = sessions.reduce((sum, s) => sum + Number(s.price || 0), 0);

  function handlePrintBill() {
    const sessionRows = sessions.map(s => `
      <tr>
        <td>${s.session}</td>
        <td>${s.liter}</td>
        <td>₹${s.price}</td>
        <td>${s.paymentStatus || 'Unpaid'}</td>
      </tr>
    `).join('');
    const billHtml = `
      <div style='font-family: Arial; padding: 24px;'>
        <h2>Milk Payment Bill</h2>
        <hr />
        <div><strong>Customer:</strong> ${customerName}</div>
        <table border='1' cellpadding='6' style='margin-top:12px;width:100%;'>
          <thead><tr><th>Session</th><th>Liter</th><th>Price</th><th>Status</th></tr></thead>
          <tbody>${sessionRows}</tbody>
        </table>
        <div style='margin-top:16px;font-weight:bold;'>Grand Total: ₹${grandTotal}</div>
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

  // Local status state for each session
  const [sessionStatus, setSessionStatus] = useState(() =>
    sessions.reduce((acc, s) => ({ ...acc, [s._id]: s.paymentStatus || 'unpaid' }), {})
  );
  // Edit mode for each session
  const [editMode, setEditMode] = useState({});

  async function handleSaveStatus(sessionId) {
    await updateMilk(sessionId, { paymentStatus: sessionStatus[sessionId] });
    setEditMode(em => ({ ...em, [sessionId]: false }));
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 16, cursor: 'pointer', marginBottom: 8 }} onClick={() => setExpanded(e => !e)}>
      <div><strong>{customerName}</strong></div>
      {sessions.map(s => {
        let extraInfo = '';
        let dateValue = s.date || paymentDate;
        if (period === 'weekly' && dateValue) {
          const dateObj = new Date(dateValue);
          const firstJan = new Date(dateObj.getFullYear(), 0, 1);
          const days = Math.floor((dateObj - firstJan) / (24 * 60 * 60 * 1000));
          const weekNum = Math.ceil((days + firstJan.getDay() + 1) / 7);
          extraInfo = `Week ${weekNum}`;
        } else if (period === 'monthly' && dateValue) {
          const dateObj = new Date(dateValue);
          const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
          extraInfo = monthName;
        }
        return (
          <div key={s._id} style={{ fontSize: '0.95em', marginTop: 4 }}>
            Session: {s.session}, Liter: {s.liter}, Status: {sessionStatus[s._id] || 'Unpaid'}
            {extraInfo && (
              <span style={{ marginLeft: 8, color: '#2196f3', fontWeight: 500 }}>({extraInfo})</span>
            )}
          </div>
        );
      })}
      <div style={{ marginTop: 8, fontWeight: 'bold' }}>Grand Total: ₹{grandTotal}</div>
      {expanded && (
        <div style={{ marginTop: 12, background: '#f0f8ff', borderRadius: 8, padding: 12 }}>
          <table style={{ width: '100%', marginBottom: 8 }}>
            <thead><tr><th>Session</th><th>Liter</th><th>Price</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s._id}>
                  <td>{s.session}</td>
                  <td>{s.liter}</td>
                  <td>₹{s.price}</td>
                  <td style={{ fontSize: '1.2em' }}>
                    {sessionStatus[s._id] === 'paid' ? '✔️' : '❌'}
                  </td>
                  <td>
                    {!editMode[s._id] ? (
                      <button type="button" onClick={e => {e.stopPropagation(); setEditMode(em => ({ ...em, [s._id]: true }));}} style={{ background: '#ffc107', color: '#333', border: 'none', padding: '2px 8px', marginRight: 8 }}>Edit</button>
                    ) : (
                      <>
                        <button type="button" onClick={e => {e.stopPropagation(); setSessionStatus(st => ({ ...st, [s._id]: st[s._id] === 'paid' ? 'unpaid' : 'paid' }));}} style={{ background: '#eee', color: '#333', border: 'none', padding: '2px 8px', marginRight: 8 }}>
                          {sessionStatus[s._id] === 'paid' ? '❌ Mark Unpaid' : '✔️ Mark Paid'}
                        </button>
                        <button type="button" onClick={e => {e.stopPropagation(); handleSaveStatus(s._id);}} style={{ background: '#4caf50', color: '#fff', border: 'none', padding: '2px 8px' }}>Save</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Grand Total: ₹{grandTotal}</div>
          <button type="button" onClick={e => {e.stopPropagation(); handlePrintBill();}} style={{ background: '#2196f3', color: '#fff', border: 'none', marginTop: 8 }}>Print Bill</button>
        </div>
      )}
    </div>
  );
}