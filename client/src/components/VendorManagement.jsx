import React, { useState, useEffect } from 'react';
import { getApiBase } from '../api.js';
import { useNavigate } from 'react-router-dom';

export default function VendorManagement({ admin }) {
  const [vendors, setVendors] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchVendors() {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (admin && admin.token) headers['Authorization'] = `Bearer ${admin.token}`;
        const res = await fetch(`${getApiBase()}/vendors`, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch vendors');
        setVendors(data);
      } catch (err) {
        console.error(err);
        alert('Failed to fetch vendors');
      }
    }
    fetchVendors();
  }, [admin]);

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

  return (
    <div>
      <button
        onClick={() => navigate('/admin')}
        style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        Back to Admin Dashboard
      </button>

      <h2>Vendor Management</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', backgroundColor: '#2c3e50', color: '#ecf0f1', borderRadius: '10px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ backgroundColor: '#1abc9c', color: '#ffffff' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Vendor Name</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Vendor Code</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map(vendor => (
            <tr key={vendor._id} style={{ borderBottom: '1px solid #34495e' }}>
              <td style={{ padding: '8px' }}>{vendor.name || 'Unnamed Vendor'}</td>
              <td style={{ padding: '8px' }}>{vendor.vendorCode || 'N/A'}</td>
              <td style={{ padding: '8px' }}>
                <button onClick={() => handleDeactivateVendor(vendor._id)} style={{ marginRight: '10px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>Deactivate</button>
                <button onClick={() => handleResetVendorPassword(vendor._id)} style={{ backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>Reset Password</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
