import React, { useEffect, useState } from 'react';
import './AdminDashboard.css';
import { getApiBase } from '../api.js';
import BackButton from './BackButton';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard({ admin, onBack }) {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [milkRates, setMilkRates] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [hasCustomerVendor, setHasCustomerVendor] = useState(false);
  const [hasRateVendor, setHasRateVendor] = useState(false);
  const [perVendorCustomers, setPerVendorCustomers] = useState(null);
  const [perVendorRates, setPerVendorRates] = useState(null);
  const [vendorCounts, setVendorCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(false);
  // Totals / period state for vendor report
  const [periodScope, setPeriodScope] = useState('daily');
  const [periodDate, setPeriodDate] = useState(() => new Date().toISOString().slice(0,10));
  const [vendorMilkEntries, setVendorMilkEntries] = useState([]);
  const [vendorSalesEntries, setVendorSalesEntries] = useState([]);
  const [totalsLoading, setTotalsLoading] = useState(false);
  const [totals, setTotals] = useState({ totalLiters: 0, totalMilkCost: 0, totalSales: 0, net: 0, margin: 0 });
  const [newPrice, setNewPrice] = useState('');

  const handleSetPrice = async () => {
    if (!selectedVendor || !newPrice) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (admin && admin.token) headers['Authorization'] = `Bearer ${admin.token}`;
      const res = await fetch(`${getApiBase()}/vendors/${selectedVendor}/price`, {
        method: 'PUT', 
        headers,
        body: JSON.stringify({ defaultMilkPrice: newPrice })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set price');
      // update local state
      setVendors(prev => prev.map(p => p._id === selectedVendor ? { ...p, defaultMilkPrice: newPrice } : p));
      alert('Price updated');
    } catch (err) {
      console.error(err);
      alert('Failed to set price');
    }
  };

  const handleDeactivateAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to deactivate this account?')) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (admin && admin.token) headers['Authorization'] = `Bearer ${admin.token}`;
      const res = await fetch(`${getApiBase()}/customers/${accountId}/deactivate`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error('Failed to deactivate account');
      alert('Account deactivated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to deactivate account');
    }
  };

  const handleResetPassword = async (accountId) => {
    const newPassword = prompt('Enter a new password:');
    if (!newPassword) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (admin && admin.token) headers['Authorization'] = `Bearer ${admin.token}`;
      const res = await fetch(`${getApiBase()}/accounts/${accountId}/reset-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error('Failed to reset password');
      alert('Password reset successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to reset password');
    }
  };

  const handleDeactivateVendor = async (vendorId) => {
    if (!window.confirm('Are you sure you want to deactivate this vendor account?')) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (admin && admin.token) headers['Authorization'] = `Bearer ${admin.token}`;
      const res = await fetch(`${getApiBase()}/vendors/${vendorId}/deactivate`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error('Failed to deactivate vendor account');
      alert('Vendor account deactivated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to deactivate vendor account');
    }
  };

  const handleResetVendorPassword = async (vendorId) => {
    const newPassword = prompt('Enter a new password for the vendor:');
    if (!newPassword) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (admin && admin.token) headers['Authorization'] = `Bearer ${admin.token}`;
      const res = await fetch(`${getApiBase()}/vendors/${vendorId}/reset-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error('Failed to reset vendor password');
      alert('Vendor password reset successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to reset vendor password');
    }
  };

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const [rv, rc, rr] = await Promise.all([
          fetch(`${getApiBase()}/vendors`),
          fetch(`${getApiBase()}/customers`),
          fetch(`${getApiBase()}/admin-extra/milk-rates`),
        ]);

        if (!rv.ok) throw new Error('Failed to fetch vendors');
        if (!rc.ok) throw new Error('Failed to fetch customers');
        if (!rr.ok) throw new Error('Failed to fetch milk rates');

  const [vendorsData, customersData, ratesData] = await Promise.all([rv.json(), rc.json(), rr.json()]);
  if (!mounted) return;
  // unwrap responses that return { value: [...] }
  const vendorsArr = Array.isArray(vendorsData) ? vendorsData : (vendorsData && vendorsData.value ? vendorsData.value : []);
  const customersArr = Array.isArray(customersData) ? customersData : (customersData && customersData.value ? customersData.value : []);
  const ratesArr = Array.isArray(ratesData) ? ratesData : (ratesData && ratesData.value ? ratesData.value : []);

  setVendors(vendorsArr);
  setCustomers(customersArr);
  setMilkRates(ratesArr);
  // detect whether customers/rates include vendor associations
  setHasCustomerVendor(Array.isArray(customersArr) && customersArr.length > 0 && (customersArr[0].vendor !== undefined || customersArr[0].vendorId !== undefined));
  setHasRateVendor(Array.isArray(ratesArr) && ratesArr.length > 0 && (ratesArr[0].vendorId !== undefined || ratesArr[0].vendor !== undefined || ratesArr[0].vendorName !== undefined));
        setFetchError('');
      } catch (err) {
        console.error(err);
        if (mounted) setFetchError(err.message || 'Failed to fetch data');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, []);

  // If the main customers array doesn't include vendor links, fetch counts per vendor for the All Vendors view
  useEffect(() => {
    if (!vendors || vendors.length === 0) return;
    if (hasCustomerVendor) return; // counts derivable from customers array

    let mounted = true;
    async function fetchCounts() {
      setCountsLoading(true);
      try {
        const results = await Promise.all(vendors.map(async v => {
          try {
            const res = await fetch(`${getApiBase()}/vendors/${v._id}/customers`);
            if (!res.ok) return { id: v._id, count: 0 };
            const data = await res.json();
            const arr = Array.isArray(data) ? data : (data.value || []);
            return { id: v._id, count: arr.length };
          } catch (e) {
            return { id: v._id, count: 0 };
          }
        }));
        if (!mounted) return;
        const map = {};
        results.forEach(r => { map[r.id] = r.count; });
        setVendorCounts(map);
      } catch (e) {
        console.debug('Failed fetching vendor counts', e);
        if (mounted) setVendorCounts({});
      } finally {
        if (mounted) setCountsLoading(false);
      }
    }

    fetchCounts();
    return () => { mounted = false; };
  }, [vendors, hasCustomerVendor]);

  // If original customers list doesn't include vendor linkage, fetch per-vendor customers on demand
  useEffect(() => {
    if (!selectedVendor || hasCustomerVendor) {
      setPerVendorCustomers(null);
      return;
    }

    let mounted = true;
    async function fetchPerVendorCustomers() {
      if (!selectedVendor) return;
      try {
  const response = await fetch(`${getApiBase()}/vendors/${selectedVendor}/customers`);
        if (!response.ok) throw new Error('Failed to fetch customers for vendor');
        const data = await response.json();
        setPerVendorCustomers(data);
      } catch (err) {
        console.error(err);
        setFetchError(err.message || 'Failed to fetch vendor-specific customers');
      }
    }

    fetchPerVendorCustomers();
    return () => { mounted = false; };
  }, [selectedVendor, hasCustomerVendor]);

  // If original rates list lacks vendor linkage, fetch per-vendor rates on demand
  useEffect(() => {
    if (!selectedVendor || hasRateVendor) {
      setPerVendorRates(null);
      return;
    }

    let mounted = true;
    async function fetchPerVendorRates() {
      try {
        setLoading(true);
        // server exposes vendor milk products at /api/vendors/:vendorId/milk
  const res = await fetch(`${getApiBase()}/vendors/${selectedVendor}/milk`);
        if (!res.ok) throw new Error('Failed to fetch vendor rates');
        const data = await res.json();
        if (!mounted) return;
        setPerVendorRates(Array.isArray(data) ? data : (data.value || []));
      } catch (e) {
        console.debug(e);
        setPerVendorRates([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchPerVendorRates();
    return () => { mounted = false; };
  }, [selectedVendor, hasRateVendor]);

  // Helper to get period date range
  function getPeriodDatesLocal(period) {
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
    } else if (period === 'all') {
      start = new Date(0);
      end = new Date(9999,0,1);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    return { start, end };
  }

  // Fetch vendor milk entries and sales for totals when selectedVendor or period changes
  useEffect(() => {
    if (!selectedVendor) {
      setVendorMilkEntries([]);
      setVendorSalesEntries([]);
      setTotals({ totalLiters: 0, totalMilkCost: 0, totalSales: 0, net: 0, margin: 0 });
      return;
    }
    let mounted = true;
    async function fetchTotalsData() {
      setTotalsLoading(true);
      try {
        const [milkRes, salesRes] = await Promise.all([
          fetch(`${getApiBase()}/vendors/${selectedVendor}/milk`),
          fetch(`${getApiBase()}/vendors/${selectedVendor}/customer-payments`)
        ]);
        const milkJson = milkRes.ok ? await milkRes.json() : [];
        const salesJson = salesRes.ok ? await salesRes.json() : [];
        const milkArr = Array.isArray(milkJson) ? milkJson : (Array.isArray(milkJson.milk) ? milkJson.milk : milkJson.value || []);
        const salesArr = Array.isArray(salesJson) ? salesJson : (Array.isArray(salesJson.sales) ? salesJson.sales : salesJson.value || []);
        if (!mounted) return;
        setVendorMilkEntries(milkArr);
        setVendorSalesEntries(salesArr);
      } catch (err) {
        console.error('Failed to fetch totals data', err);
        if (mounted) {
          setVendorMilkEntries([]);
          setVendorSalesEntries([]);
        }
      } finally {
        if (mounted) setTotalsLoading(false);
      }
    }
    fetchTotalsData();
    return () => { mounted = false; };
  }, [selectedVendor, periodScope, periodDate]);

  // Compute totals when entries change or period filters change
  useEffect(() => {
    if (!selectedVendor) return;
    const { start, end } = getPeriodDatesLocal(periodScope);
    // If custom, use periodDate as exact day
    let filterStart = start, filterEnd = end;
    if (periodScope === 'custom') {
      const d = new Date(periodDate);
      filterStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      filterEnd = new Date(filterStart);
      filterEnd.setDate(filterStart.getDate() + 1);
    }
    const fm = (vendorMilkEntries || []).filter(item => {
      if (!item.date) return false;
      const dt = new Date(item.date);
      return dt >= filterStart && dt < filterEnd;
    });
    const fs = (vendorSalesEntries || []).filter(item => {
      if (!item.date) return false;
      const dt = new Date(item.date);
      return dt >= filterStart && dt < filterEnd;
    });
    const totalLiters = fm.reduce((s, it) => s + (parseFloat(it.liter ?? it.quantity) || 0), 0);
    const totalMilkCost = fm.reduce((s, it) => s + (parseFloat(it.price) || 0), 0);
    const totalSales = fs.reduce((s, it) => s + (parseFloat(it.total) || 0), 0);
    const net = totalSales - totalMilkCost;
    const margin = totalSales ? (net / totalSales) * 100 : 0;
    setTotals({ totalLiters, totalMilkCost, totalSales, net, margin });
  }, [vendorMilkEntries, vendorSalesEntries, periodScope, periodDate, selectedVendor]);

  // Export CSV with totals and details
  function exportCSV() {
    if (!selectedVendor) return;
    const rows = [];
    rows.push(['Vendor', selectedVendorObj ? selectedVendorObj.name : selectedVendor]);
    rows.push(['Period', periodScope === 'custom' ? periodDate : periodScope]);
    rows.push([]);
    rows.push(['Total Milk (Liters)', totals.totalLiters.toFixed(2)]);
    rows.push(['Total Milk Cost (₹)', totals.totalMilkCost.toFixed(2)]);
    rows.push(['Total Sales (₹)', totals.totalSales.toFixed(2)]);
    rows.push(['Net (₹)', totals.net.toFixed(2)]);
    rows.push(['Margin %', totals.margin.toFixed(2)]);
    rows.push([]);
    rows.push(['Milk Entries:']);
    rows.push(['_id','date','customer','session','liter','price']);
    vendorMilkEntries.forEach(m => rows.push([m._id, m.date ? m.date.split('T')[0] : '', typeof m.customer === 'object' ? m.customer.name : m.customer, m.session, m.liter, m.price]));
    rows.push([]);
    rows.push(['Sales Entries:']);
    rows.push(['_id','date','product','customer','quantity','total']);
    vendorSalesEntries.forEach(s => rows.push([s._id, s.date ? s.date.split('T')[0] : '', s.productId && s.productId.name ? s.productId.name : s.productId, s.customer, s.quantity, s.total]));

    const csv = rows.map(r => r.map(c => `"${String(c || '')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedVendorObj ? selectedVendorObj.name.replace(/\s+/g,'_') : 'vendor'}_report_${periodScope}${periodScope==='custom'?`_${periodDate}`:''}.csv`;
    document.body.appendChild(a);
    try {
      // trigger download; wrap in try/catch in case the element was removed by another handler
      a.click();
    } catch (err) {
      console.error('Failed to trigger download click', err);
    }
    // remove only if still attached to a parent
    if (a.parentNode) {
      a.parentNode.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }

  // Helper to normalize vendor id whether stored as a string or an object
  const getVendorId = v => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return String(v);
    // If it's an object, try common id fields, or return empty string
    const id = v._id || v.id || v.vendorId || '';
    return id ? String(id) : '';
  };

  // Find selected vendor object (if available)
  const selectedVendorObj = vendors.find(v => String(v._id) === String(selectedVendor));

  // Robust matching: try id match, then JSON text search, then name match
  const vendorMatches = (vendorField) => {
    if (!selectedVendor) return true;
    // direct id match
    const vid = getVendorId(vendorField);
    if (vid && String(vid) === String(selectedVendor)) return true;
    // if vendorField is a string that might contain the id
    if (typeof vendorField === 'string' && vendorField.includes(String(selectedVendor))) return true;
    // as a last resort, stringify and search
    try {
      const txt = JSON.stringify(vendorField || '');
      if (txt.includes(String(selectedVendor))) return true;
    } catch (e) {
      // ignore
    }
    // match by vendor name when selectedVendorObj exists
    if (selectedVendorObj && vendorField) {
      const name = selectedVendorObj.name;
      if (!name) return false;
      // vendorField may itself be an object or string containing the name
      if (typeof vendorField === 'string' && vendorField === name) return true;
      try {
        const txt = JSON.stringify(vendorField || '');
        if (txt.includes(name)) return true;
      } catch (e) {}
    }
    return false;
  };

  const customersCount = customers.filter(c => {
    if (!selectedVendor) return true;
    return vendorMatches(c.vendor);
  }).length;
  // visibleCustomers and visibleRates: account for missing vendor links by falling back to per-vendor endpoints
  const visibleCustomers = (() => {
    if (!selectedVendor) return customers;
    if (hasCustomerVendor) return customers.filter(c => vendorMatches(c.vendor));
    if (perVendorCustomers) return perVendorCustomers;
    // cannot determine per-vendor customers
    return [];
  })();

  const visibleRates = (() => {
    if (!selectedVendor) return milkRates;
    if (hasRateVendor) return milkRates.filter(r => vendorMatches(r.vendorId || r.vendor || r));
    if (perVendorRates) return perVendorRates;
    return [];
  })();

  // Deduplicate rates by _id or by (name|price) to avoid showing duplicate rows in the admin report
  const dedupedVisibleRates = (() => {
    const seen = new Set();
    const out = [];
    (visibleRates || []).forEach(r => {
      const key = r && (r._id ? String(r._id) : `${r.name || ''}|${r.price ?? r.rate ?? ''}`);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(r);
      }
    });
    return out;
  })();

  return (
    <div className="admin-dashboard-root">
      <div className="admin-dashboard-card">
        <div className="admin-dashboard-header">
          <h1 className="admin-dashboard-title">Admin Dashboard</h1>
          <BackButton onBack={onBack} />
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
          <button
            onClick={() => navigate('/admin/vendor-management')}
            style={{ padding: '10px 20px', backgroundColor: '#1abc9c', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Go to Vendor Management
          </button>
          <button
            onClick={() => navigate('/admin/customer-management')}
            style={{ padding: '10px 20px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Go to Customer Management
          </button>
        </div>

        <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <label htmlFor="vendor-select" style={{ fontWeight: 600 }}>Select Vendor:</label>
          <select id="vendor-select" value={selectedVendor} onChange={e => setSelectedVendor(e.target.value)} style={{ minWidth: 160, padding: 6 }}>
            <option value="">All Vendors</option>
            {vendors.map(v => (
              <option key={v._id} value={v._id}>{v.name}</option>
            ))}
          </select>
        </div>

        {fetchError && (
          <div style={{ color: 'red', marginBottom: 16, fontWeight: 600 }}>{fetchError}</div>
        )}

        <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 900, background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
            <h2 style={{ marginBottom: 16 }}>Vendor Report</h2>

            {loading ? (
              <div>Loading...</div>
            ) : (
              <>
                {!selectedVendor ? (
                  // All vendors view: show vendor list with customer counts
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <strong>Vendors</strong>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                      <thead>
                          <tr style={{ background: '#f6d365', color: '#fff' }}>
                              <th style={{ padding: 8, textAlign: 'left' }}>Vendor</th>
                              <th style={{ padding: 8, textAlign: 'left' }}>Vendor Code</th>
                            <th style={{ padding: 8, textAlign: 'left' }}>Customer Count</th>
                            <th style={{ padding: 8, textAlign: 'left' }}>Status</th>
                            <th style={{ padding: 8, textAlign: 'left' }}>Action</th>
                          </tr>
                      </thead>
                      <tbody>
                        {vendors.map(v => {
                          const count = hasCustomerVendor
                            ? customers.filter(c => getVendorId(c.vendor) === String(v._id)).length
                            : (vendorCounts[v._id] ?? 0);
                          return (
                            <tr key={v._id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: 8 }}>{v.name}</td>
                                <td style={{ padding: 8 }}>{v.vendorCode || '—'}</td>
                                <td style={{ padding: 8 }}>{countsLoading ? '…' : count}</td>
                                <td style={{ padding: 8 }}>{v.status || 'pending'}</td>
                              <td style={{ padding: 8 }}>
                                <button type="button" onClick={() => setSelectedVendor(v._id)} style={{ padding: '6px 10px', borderRadius: 6, background: '#4da6ff', color: '#fff', border: 'none', cursor: 'pointer', marginRight: 8 }}>View</button>
                                {v.status !== 'approved' && (
                                  <button type="button" onClick={async () => {
                                    if (!window.confirm('Approve this vendor?')) return;
                                    try {
                                      const headers = { 'Content-Type': 'application/json' };
                                      if (admin && admin.token) headers['Authorization'] = `Bearer ${admin.token}`;
                                      const res = await fetch(`${getApiBase()}/vendors/${v._id}/approve`, { method: 'PUT', headers });
                                      const data = await res.json();
                                      if (!res.ok) throw new Error(data.error || 'Failed to approve');
                                      // update local state
                                      setVendors(prev => prev.map(p => p._id === v._id ? { ...p, status: 'approved' } : p));
                                      alert('Vendor approved');
                                    } catch (err) {
                                      console.error(err);
                                      alert('Failed to approve vendor');
                                    }
                                  }} style={{ padding: '6px 10px', borderRadius: 6, background: '#46bf6a', color: '#fff', border: 'none', cursor: 'pointer', marginRight: 8 }}>Approve</button>
                                )}
                                <button type="button" onClick={async () => {
                                  if (!window.confirm('Delete this vendor? This cannot be undone.')) return;
                                    try {
                                    const headers = { 'Content-Type': 'application/json' };
                                    if (admin && admin.token) headers['Authorization'] = `Bearer ${admin.token}`;
                                    const res = await fetch(`${getApiBase()}/vendors/${v._id}`, { method: 'DELETE', headers });
                                    if (!res.ok) throw new Error('Failed to delete');
                                    setVendors(prev => prev.filter(p => p._id !== v._id));
                                    alert('Vendor deleted');
                                  } catch (err) {
                                    console.error(err);
                                    alert('Failed to delete vendor');
                                  }
                                }} style={{ padding: '6px 10px', borderRadius: 6, background: '#e53935', color: '#fff', border: 'none', cursor: 'pointer' }}>Delete</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // Single vendor view: show products and customers for selected vendor
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div><strong>Customers:</strong> {visibleCustomers.length}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <label style={{ fontWeight: 600 }}>Period:</label>
                        <select value={periodScope} onChange={e => setPeriodScope(e.target.value)} style={{ padding: 6 }}>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                          <option value="all">All-time</option>
                          <option value="custom">Custom</option>
                        </select>
                        {periodScope === 'custom' && (
                          <input type="date" value={periodDate} onChange={e => setPeriodDate(e.target.value)} style={{ padding: 6 }} />
                        )}
                        <button onClick={exportCSV} style={{ padding: '6px 10px', background: '#4da6ff', color: '#fff', border: 'none', borderRadius: 6 }}>Export CSV</button>
                      </div>
                    </div>

                    {/* Totals card */}
                    <div className="totals-card" style={{ marginBottom: 12, background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                      {totalsLoading ? (
                        <div>Loading totals...</div>
                      ) : (
                        <>
                          <div className="totals-item" style={{ background: '#e3f2fd' }}>
                            <div className="label">Total Milk (Liters)</div>
                            <div className="value">{totals.totalLiters.toFixed(2)}</div>
                          </div>
                          <div className="totals-item" style={{ background: '#fff3e0' }}>
                            <div className="label">Total Milk Cost (₹)</div>
                            <div className="value">₹{totals.totalMilkCost.toFixed(2)}</div>
                          </div>
                          <div className="totals-item" style={{ background: '#e8f5e9' }}>
                            <div className="label">Total Sales (₹)</div>
                            <div className="value">₹{totals.totalSales.toFixed(2)}</div>
                          </div>
                          <div className="totals-item" style={{ background: totals.net >= 0 ? '#e8f5e9' : '#ffebee' }}>
                            <div className="label">Net (₹)</div>
                            <div className="value">₹{totals.net.toFixed(2)}</div>
                            <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Margin: {totals.margin.toFixed(2)}%</div>
                          </div>
                        </>
                      )}
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <strong>Milk Products / Prices:</strong>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                        <thead>
                          <tr style={{ background: '#f6d365', color: '#fff' }}>
                            <th style={{ padding: 8, textAlign: 'left' }}>Product</th>
                            <th style={{ padding: 8, textAlign: 'left' }}>Price (₹/liter)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dedupedVisibleRates.length > 0 ? (
                            dedupedVisibleRates.map((r, idx) => {
                              // Prefer the vendor's persisted defaultMilkPrice (per-liter) when available.
                              const vendorPrice = selectedVendorObj && selectedVendorObj.defaultMilkPrice !== undefined && selectedVendorObj.defaultMilkPrice !== null
                                ? selectedVendorObj.defaultMilkPrice
                                : undefined;
                              const rowPrice = vendorPrice !== undefined ? vendorPrice : ((r.price ?? r.rate ?? r.price) ?? '—');
                              const rowName = r.name || r.vendorName || (selectedVendorObj && selectedVendorObj.name) || '—';
                              return (
                                <tr key={r._id || r.vendorId || idx} style={{ borderBottom: '1px solid #eee' }}>
                                  <td style={{ padding: 8 }}>{rowName}</td>
                                  <td style={{ padding: 8 }}>{rowPrice}</td>
                                </tr>
                              );
                            })
                          ) : (
                            // No per-vendor rates available — if vendor has a default price, show it once
                            selectedVendorObj && selectedVendorObj.defaultMilkPrice !== undefined && selectedVendorObj.defaultMilkPrice !== null ? (
                              <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: 8 }}>{selectedVendorObj.name}</td>
                                <td style={{ padding: 8 }}>{selectedVendorObj.defaultMilkPrice}</td>
                              </tr>
                            ) : (
                              <tr>
                                <td colSpan={2} style={{ padding: 8, color: '#777' }}>No price data available</td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                      <div style={{ marginTop: 12 }}>
                        <input type="number" placeholder="Set default price" onChange={e => setNewPrice(e.target.value)} style={{ padding: 6, marginRight: 8 }} />
                        <button onClick={handleSetPrice} style={{ padding: '6px 10px', background: '#46bf6a', color: '#fff', border: 'none', borderRadius: 6 }}>Set Price</button>
                      </div>
                    </div>

                    <div style={{ marginTop: 18 }}>
                      <strong>Customers for selected vendor:</strong>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                        <thead>
                          <tr style={{ background: '#fda085', color: '#fff' }}>
                            <th style={{ padding: 8, textAlign: 'left' }}>Name</th>
                            <th style={{ padding: 8, textAlign: 'left' }}>Code</th>
                            <th style={{ padding: 8, textAlign: 'left' }}>Phone</th>
                            <th style={{ padding: 8, textAlign: 'left' }}>Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleCustomers.map(c => (
                            <tr key={c._id} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: 8 }}>{c.name}</td>
                              <td style={{ padding: 8 }}>{c.customerCode || '—'}</td>
                              <td style={{ padding: 8 }}>{c.phone || '—'}</td>
                              <td style={{ padding: 8 }}>{c.address || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginTop: '20px' }}>
        <h3 style={{ color: '#1abc9c' }}>Customer Account Management</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', backgroundColor: '#2c3e50', color: '#ecf0f1', borderRadius: '10px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ backgroundColor: '#1abc9c', color: '#ffffff' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>Customer Name</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Phone</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleCustomers.map(customer => (
              <tr key={customer._id} style={{ borderBottom: '1px solid #34495e' }}>
                <td style={{ padding: '8px' }}>{customer.name || 'Unnamed Customer'}</td>
                <td style={{ padding: '8px' }}>{customer.phone || 'N/A'}</td>
                <td style={{ padding: '8px' }}>
                  <button onClick={() => handleDeactivateAccount(customer._id)} style={{ marginRight: '10px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>Deactivate</button>
                  <button onClick={() => handleResetPassword(customer._id)} style={{ backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>Reset Password</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3 style={{ color: '#1abc9c' }}>Vendor Account Management</h3>
        {selectedVendorObj && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', backgroundColor: '#2c3e50', color: '#ecf0f1', borderRadius: '10px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: '#1abc9c', color: '#ffffff' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Vendor Name</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Vendor Code</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #34495e' }}>
                <td style={{ padding: '8px' }}>{selectedVendorObj.name || 'Unnamed Vendor'}</td>
                <td style={{ padding: '8px' }}>{selectedVendorObj.vendorCode || 'N/A'}</td>
                <td style={{ padding: '8px' }}>
                  <button onClick={() => handleDeactivateVendor(selectedVendorObj._id)} style={{ marginRight: '10px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>Deactivate</button>
                  <button onClick={() => handleResetVendorPassword(selectedVendorObj._id)} style={{ backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>Reset Password</button>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
                  </>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
