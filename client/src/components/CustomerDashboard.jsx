import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CustomerDashboard.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getApiBase } from '../api';

export default function CustomerDashboard({ vendorId, customerId }) {
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [report, setReport] = useState({ milkTotal: 0, totalCost: 0 });
  const [vendorPrice, setVendorPrice] = useState(null);

  const apiBase = getApiBase();

  useEffect(() => {
    console.log('[CustomerDashboard] vendorId:', vendorId);
    console.log('[CustomerDashboard] Initializing data fetch...');

    if (!vendorId || !customerId) {
      console.error('[CustomerDashboard] Missing vendorId or customerId');
      return;
    }

    async function fetchEntries() {
      try {
        console.log('[CustomerDashboard] Fetching entries...');
        const res = await fetch(`${apiBase}/vendors/${vendorId}/customers/${customerId}/entries?limit=30`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('[CustomerDashboard] Entries response status:', res.status);
        if (!res.ok) throw new Error('Failed to fetch entries');
        const data = await res.json();
        console.log('[CustomerDashboard] Entries data:', data);
        setEntries(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('[CustomerDashboard] Error fetching entries:', err);
        setEntries([]);
      }
    }

    async function fetchMilkSummary() {
      try {
        console.log('[CustomerDashboard] Fetching milk summary...');
        const res = await fetch(`${apiBase}/customers/${customerId}/milk-summary`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('[CustomerDashboard] Milk summary response status:', res.status);
        if (!res.ok) throw new Error('Failed to fetch milk summary');
        const data = await res.json();
        console.log('[CustomerDashboard] Milk summary data:', data);
        setReport({ milkTotal: data.totalLiters || 0, totalCost: data.totalCost || 0 });
      } catch (err) {
        console.error('[CustomerDashboard] Error fetching milk summary:', err);
        setReport({ milkTotal: 0, totalCost: 0 });
      }
    }

    async function fetchVendorPrice() {
      try {
        console.log('[CustomerDashboard] Fetching vendor price...');
        const res = await fetch(`${getApiBase()}/vendors/${vendorId}/price`);
        console.log('[CustomerDashboard] Vendor price response status:', res.status);
        if (!res.ok) throw new Error('Failed to fetch vendor price');
        const data = await res.json();
        console.log('[CustomerDashboard] Vendor price data:', JSON.stringify(data, null, 2));
        setVendorPrice(data.defaultMilkPrice || null);
      } catch (err) {
        console.error('[CustomerDashboard] Error fetching vendor price:', err);
        setVendorPrice(null);
      }
    }

    fetchEntries();
    fetchMilkSummary();
    fetchVendorPrice();
  }, [vendorId, customerId]);

  const filteredEntries = entries.filter(e => {
    const entryDate = new Date(e.date || e.createdAt);
    if (isNaN(entryDate)) return false;

    if (selectedPeriod === 'daily') {
      return entryDate.toLocaleDateString() === selectedDate.toLocaleDateString();
    } else if (selectedPeriod === 'weekly') {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return entryDate >= startOfWeek && entryDate <= endOfWeek;
    } else if (selectedPeriod === 'monthly') {
      return entryDate.getMonth() === selectedDate.getMonth() &&
             entryDate.getFullYear() === selectedDate.getFullYear();
    }
    return true; // Should not happen
  });

  const grandTotal = filteredEntries.reduce((total, entry) => total + (entry.price || 0), 0);

  const totalMilkLiters = report.milkTotal || 0;

  const totalMilkCost = report.totalCost || 0;

  console.log('[CustomerDashboard] Filtered entries:', filteredEntries);
  console.log('[CustomerDashboard] Grand total:', grandTotal);
  console.log('[CustomerDashboard] Total milk liters:', totalMilkLiters);
  console.log('[CustomerDashboard] Total milk cost:', totalMilkCost);

  let displayPrice = vendorPrice;
  if (displayPrice === null && entries.length > 0) {
    const latestEntry = entries.find(e => e.liter > 0);
    if (latestEntry && latestEntry.price && latestEntry.liter) {
      displayPrice = latestEntry.price / latestEntry.liter;
    }
  }

  const [uploadedPdfUrl, setUploadedPdfUrl] = useState(null);
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState(null);
  const [pdfData, setPdfData] = useState(null);

  async function generatePDF() {
    try {
      const res = await fetch(`${apiBase}/milk/customer/${customerId}/bill?period=${selectedPeriod}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!res.ok) throw new Error('Failed to fetch bill data');

      const bill = await res.json();
      setCustomerPhoneNumber(bill.billTo.contactNumber);
      const doc = new jsPDF();

      // Add header
      doc.setFontSize(20);
      doc.text('INVOICE', 105, 20, { align: 'center' });

      // Add business details
      doc.setFontSize(10);
      doc.text('Your Business Name', 10, 30);
      doc.text('123 Milk Lane, Milky Way, 12345', 10, 35);
      doc.text('GSTIN: ABC12345', 10, 40);

      // Add invoice details
      doc.text(`Invoice No: ${bill.invoiceNo}`, 10, 50);
      doc.text(`Invoice Date: ${bill.invoiceDate}`, 10, 55);
      doc.text(`Bill Period: ${bill.billPeriod}`, 10, 60);
      doc.text(`Due Date: ${bill.dueDate}`, 10, 65);

      // Add customer details
      doc.text('Bill To:', 10, 75);
      doc.text(bill.billTo.name, 10, 80);
      doc.text(bill.billTo.address, 10, 85);
      doc.text(bill.billTo.contactNumber, 10, 90);

      // Add table
      autoTable(doc, {
        startY: 100,
        head: [['Date', 'Item Description', 'Quantity (Liters)', 'Rate (per Liter)', 'Total (INR)']],
        body: bill.itemizedDetails.map(item => [
          item.date,
          item.itemDescription,
          item.quantity.toFixed(2),
          item.rate.toFixed(2),
          item.total.toFixed(2),
        ]),
      });

      // Save the PDF locally
      doc.save(`bill-${bill.invoiceNo}.pdf`);

      // Upload PDF to server
      const pdfBlob = doc.output('blob');
      const pdfData = { blob: pdfBlob, fileName: `bill-${bill.invoiceNo}.pdf` };
      setPdfData(pdfData);
      const formData = new FormData();
      formData.append('billPdf', pdfBlob, `bill-${bill.invoiceNo}.pdf`);

      const uploadRes = await fetch(`${apiBase}/milk/upload-bill`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload PDF');

      const uploadData = await uploadRes.json();
      const uploadedPdfUrl = `${apiBase}${uploadData.fileUrl}`;
      setUploadedPdfUrl(uploadedPdfUrl);

      return { pdfData, uploadedPdfUrl };

    } catch (err) {
      console.error('Error generating or uploading PDF:', err);
      return null;
    }
  }

  const shareOnWhatsApp = async () => {
    const generatedData = await generatePDF();

    if (generatedData) {
      const { pdfData, uploadedPdfUrl } = generatedData;

      if (pdfData && navigator.share && navigator.canShare) {
        const pdfFile = new File([pdfData.blob], pdfData.fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [pdfFile] })) {
          try {
            await navigator.share({
              files: [pdfFile],
              title: `Milk Bill - ${pdfData.fileName}`,
              text: 'Here is your milk bill.',
            });
            return; // Exit if share is successful
          } catch (err) {
            console.error('Failed to share PDF via Web Share API:', err);
          }
        }
      }

      // Fallback to opening WhatsApp with a link
      if (uploadedPdfUrl && customerPhoneNumber) {
        const message = `Here is your milk bill: ${uploadedPdfUrl}`;
        const whatsappUrl = `https://wa.me/${customerPhoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    }
  };

  return (
    <div className="customer-dashboard" style={{ fontFamily: 'Arial, sans-serif', color: '#34495e', backgroundColor: '#e6f6ff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#007bff' }}>Milk Management System</h1>
      <div className="totals-card" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
        <div className="totals-item" style={{ background: '#007bff', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#ffffff', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
          <div className="label" style={{ fontSize: '16px', fontWeight: 'bold' }}>Total Milk (Liters)</div>
          <div className="value" style={{ fontSize: '24px' }}>{Number(totalMilkLiters).toFixed(2)}</div>
        </div>
        <div className="totals-item" style={{ background: '#007bff', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#ffffff', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
          <div className="label" style={{ fontSize: '16px', fontWeight: 'bold' }}>Total Milk Cost (₹)</div>
          <div className="value" style={{ fontSize: '24px' }}>₹{Number(totalMilkCost).toFixed(2)}</div>
          {displayPrice !== null && (
            <div className="vendor-price" style={{ fontSize: '14px', marginTop: '10px' }}>Vendor price: ₹{Number(vendorPrice).toFixed(2)}</div>
          )}
        </div>
        <div className="totals-item" style={{ background: '#007bff', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#ffffff', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
          <div className="label" style={{ fontSize: '16px', fontWeight: 'bold' }}>Vendor Milk Price (₹)</div>
          <div className="value" style={{ fontSize: '24px' }}>{displayPrice !== null ? `₹${Number(displayPrice).toFixed(2)}` : 'Not set'}</div>
        </div>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#007bff' }}>Milk Purchase History</h2>
      <div className="date-filters" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          className="calendar-style"
          locale="en-US"
          tileContent={({ date, view }) => {
            if (view === 'month') {
              const entriesForDate = entries.filter(e => {
                const dVal = e.date || e.createdAt || null;
                const d = dVal ? new Date(dVal) : null;
                return d && d.toDateString() === date.toDateString();
              });
              if (entriesForDate.length > 0) {
                return (
                  <div style={{ textAlign: 'center' }}>
                    {entriesForDate.map((entry, index) => {
                      const tickColor = entry.session === 'morning' ? 'green' : 'red';
                      return (
                        <span key={index} style={{ color: tickColor, marginRight: 4 }}>
                          ✓
                        </span>
                      );
                    })}
                  </div>
                );
              }
            }
            return null;
          }}
          onActiveStartDateChange={({ activeStartDate }) => {
            const correctedDate = new Date(activeStartDate);
            correctedDate.setHours(0, 0, 0, 0); // Ensure timezone alignment
            setSelectedDate(correctedDate);
          }}
        />
        <select
          value={selectedPeriod}
          onChange={e => setSelectedPeriod(e.target.value)}
          style={{ padding: '10px 15px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: '#e6f6ff', color: '#007bff' }}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', backgroundColor: '#2c3e50', color: '#ecf0f1', borderRadius: '10px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ backgroundColor: '#1abc9c', color: '#ffffff' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Session</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Liter</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Price</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredEntries.map(e => {
            const dVal = e.date || e.createdAt || null;
            const dt = dVal ? new Date(dVal) : null;
            const dateStr = dt && !isNaN(dt) ? dt.toLocaleDateString() : '—';
            return (
              <tr key={e._id} style={{ borderBottom: '1px solid #34495e' }}>
                <td style={{ padding: '8px' }}>{e.session}</td>
                <td style={{ padding: '8px' }}>{e.liter}</td>
                <td style={{ padding: '8px' }}>₹{e.price}</td>
                <td style={{ padding: '8px' }}>{dateStr}</td>
              </tr>
            );
          })}
        </tbody>
      </table>



      <h2 style={{ textAlign: 'center', marginBottom: '10px', color: '#1abc9c' }}>{selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Bill</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', backgroundColor: '#2c3e50', color: '#ecf0f1', borderRadius: '10px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ backgroundColor: '#1abc9c', color: '#ffffff' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Session</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Quantity (Liters)</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {filteredEntries.map(e => {
            const dVal = e.date || e.createdAt || null;
            const dt = dVal ? new Date(dVal) : null;
            const dateStr = dt && !isNaN(dt) ? dt.toLocaleDateString() : '—';
            return (
              <tr key={e._id} style={{ borderBottom: '1px solid #34495e' }}>
                <td style={{ padding: '8px' }}>{dateStr}</td>
                <td style={{ padding: '8px' }}>{e.session}</td>
                <td style={{ padding: '8px' }}>{e.liter}</td>
                <td style={{ padding: '8px' }}>₹{e.price}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3 style={{ textAlign: 'center', marginBottom: '10px', color: '#1abc9c' }}>{selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Grand Total: ₹{filteredEntries.reduce((total, entry) => total + entry.price, 0)}</h3>



      <button
        onClick={shareOnWhatsApp}
        style={{ padding: '10px 20px', backgroundColor: '#25D366', color: '#ffffff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px' }}
      >
        Share Bill on WhatsApp
      </button>

      <style>
        {`
          .calendar-style {
            border: none;
            border-radius: 8px;
            background-color: #2c3e50; /* Dark background color */
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            padding: 20px;
            margin: 0 auto; /* Center the calendar */
            max-width: 100%;
            color: #ecf0f1; /* Light text color */
          }

          .react-calendar__navigation {
            background-color: #34495e; /* Slightly lighter dark color for navigation */
            color: #ecf0f1; /* Light text */
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
            font-size: 18px; /* Adjusted font size for better visibility */
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Subtle shadow for better visibility */
          }

          .react-calendar__navigation button {
            color: #ecf0f1; /* Light text */
            background: none;
            border: none;
            font-size: 18px; /* Adjusted font size */
            cursor: pointer;
          }

          .react-calendar__navigation button:disabled {
            color: #7f8c8d; /* Disabled button color */
          }

          .react-calendar__navigation button:hover {
            color: #f39c12; /* Highlight color on hover */
          }

          .react-calendar__month-view__days {
            display: grid !important;
            grid-template-columns: repeat(7, minmax(30px, 1fr)) !important; /* Ensures consistent width for all dates */
            gap: 2px !important; /* Further reduced gap for better fit */
            justify-items: center; /* Center items horizontally */
            align-items: center; /* Center items vertically */
            padding: 0 2px; /* Adjusted padding for proper fit */
          }

          .react-calendar__month-view__days__day {
            color: #ecf0f1; /* Light text for better readability */
            font-size: 10px; /* Further reduced font size for better fit */
            border-radius: 4px; /* Slightly rounded corners */
            transition: background-color 0.3s;
            padding: 4px; /* Further reduced padding for better fit */
            margin: 0;
            text-align: center;
            background: #34495e; /* Dark background for days */
            box-sizing: border-box; /* Ensures consistent sizing */
          }

          .react-calendar__tile--active {
            background: #f39c12; /* Highlight color for active tile */
            color: #2c3e50; /* Dark text for contrast */
            border-radius: 4px;
          }

          .react-calendar__tile:hover {
            background: #1abc9c; /* Hover color */
          }
        `}
      </style>
    </div>
  );
}
