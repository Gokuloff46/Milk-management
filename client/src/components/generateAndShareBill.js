
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getApiBase } from '../api.js';

export const generateBill = async (group, grandTotal) => {
  const doc = new jsPDF();
  doc.text('Milk Management Bill', 14, 16);
  doc.text(`Customer: ${group.name}`, 14, 24);
  doc.text(`Period: Monthly`, 14, 32);

  autoTable(doc, {
    startY: 40,
    head: [['Date', 'Session', 'Quantity (Liters)', 'Price']],
    body: group.sessions.map(s => {
      const dVal = s.date || s.createdAt || null;
      const dt = dVal ? new Date(dVal) : null;
      const dateStr = dt && !isNaN(dt) ? dt.toLocaleDateString() : '—';
      return [dateStr, s.session, s.liter, `₹${s.price}`];
    }),
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.text(`Grand Total: ₹${grandTotal}`, 14, finalY);

  const pdfBlob = doc.output('blob');
  return new File([pdfBlob], `Bill-${group.name}.pdf`, { type: 'application/pdf' });
};

export const shareBill = async (billFile, customer, vendor) => {
  if (!billFile) {
    alert('Please generate the bill first.');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('file', billFile, 'bill.pdf');
    formData.append('customerId', customer._id);
    formData.append('vendorId', vendor && vendor._id ? vendor._id : '');

    const uploadRes = await fetch(`${getApiBase()}/milk/upload-bill`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) throw new Error('Failed to upload bill');
    const { url } = await uploadRes.json();

    const phone = customer.phone || '';
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(url)}`;
    window.open(waUrl, '_blank');
  } catch (err) {
    console.error('Failed to share PDF via WhatsApp:', err);
    alert('Failed to share bill on WhatsApp.');
  }
};
