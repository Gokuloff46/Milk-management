import React, { useState, useEffect } from 'react';
import { getApiBase } from '../api.js';
import { useNavigate } from 'react-router-dom';

export default function CustomerManagement({ admin }) {
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (admin && admin.token) headers['Authorization'] = `Bearer ${admin.token}`;
        const res = await fetch(`${getApiBase()}/customers`, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch customers');
        setCustomers(data);
      } catch (err) {
        console.error(err);
        alert('Failed to fetch customers');
      }
    }
    fetchCustomers();
  }, [admin]);

  const handleDeactivateCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to deactivate this customer account?')) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (admin && admin.token) headers['Authorization'] = `Bearer ${admin.token}`;
      const res = await fetch(`${getApiBase()}/customers/${customerId}/deactivate`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error('Failed to deactivate customer account');
      alert('Customer account deactivated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to deactivate customer account');
    }
  };

  const handleResetCustomerPassword = async (customerId) => {
    const newPassword = prompt('Enter a new password for the customer:');
    if (!newPassword) return;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (admin && admin.token) headers['Authorization'] = `Bearer ${admin.token}`;
      const res = await fetch(`${getApiBase()}/customers/${customerId}/reset-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error('Failed to reset customer password');
      alert('Customer password reset successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to reset customer password');
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

      <h2>Customer Management</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', backgroundColor: '#2c3e50', color: '#ecf0f1', borderRadius: '10px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ backgroundColor: '#1abc9c', color: '#ffffff' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Customer Name</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Phone</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <tr key={customer._id} style={{ borderBottom: '1px solid #34495e' }}>
              <td style={{ padding: '8px' }}>{customer.name || 'Unnamed Customer'}</td>
              <td style={{ padding: '8px' }}>{customer.phone || 'N/A'}</td>
              <td style={{ padding: '8px' }}>
                <button onClick={() => handleDeactivateCustomer(customer._id)} style={{ marginRight: '10px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>Deactivate</button>
                <button onClick={() => handleResetCustomerPassword(customer._id)} style={{ backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>Reset Password</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
