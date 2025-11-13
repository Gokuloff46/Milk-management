import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { getApiBase } from '../api.js';

const SALES_API = `${getApiBase()}/sales`;
const VENDORS_API = `${getApiBase()}/vendors`;

export default function CustomerSummary({ customer }) {
  const { vendor } = useAuth();
  const [summary, setSummary] = useState({ totalLiters: 0, totalCost: 0 });
  const [vendorPrice, setVendorPrice] = useState(null);

  // Effect to fetch vendor's default milk price
  useEffect(() => {
    async function fetchVendorPrice() {
      if (vendor && vendor._id) {
        try {
          const res = await fetch(`${VENDORS_API}/${vendor._id}/price`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.defaultMilkPrice !== null) {
              setVendorPrice(parseFloat(data.defaultMilkPrice));
            }
          }
        } catch (error) {
          console.error('Failed to fetch vendor price:', error);
        }
      }
    }
    fetchVendorPrice();
  }, [vendor]);

  // Effect to fetch summary for the current month
  useEffect(() => {
    async function fetchSummary() {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

      const params = new URLSearchParams();
      params.set('customer', customer._id);
      params.set('startDate', startDate);
      params.set('endDate', endDate);

      if (vendor && vendor._id) {
        params.set('vendor', vendor._id);
      }

      try {
        const res = await fetch(`${SALES_API}?${params.toString()}`);
        const data = await res.json();
        
        const sales = Array.isArray(data) ? data : (Array.isArray(data.sales) ? data.sales : []);
        
        let totalLiters = 0;
        let totalCost = 0;
        for (const sale of sales) {
          totalLiters += sale.quantity || 0;
          totalCost += sale.total || 0;
        }
        setSummary({ totalLiters, totalCost });
      } catch (error) {
        console.error('Failed to fetch summary:', error);
        setSummary({ totalLiters: 0, totalCost: 0 });
      }
    }

    if (customer && customer._id) {
      fetchSummary();
    }
  }, [customer, vendor]);

  return (
    <div style={{ marginTop: 32, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
      <h3>Monthly Milk Summary</h3>
      {vendorPrice !== null && (
        <p><b>Current Vendor Price:</b> ₹{vendorPrice} / L</p>
      )}
      <p><b>Total Liters Bought (This Month):</b> {summary.totalLiters.toFixed(2)} L</p>
      <p><b>Total Cost (This Month):</b> ₹{summary.totalCost.toFixed(2)}</p>
    </div>
  );
}