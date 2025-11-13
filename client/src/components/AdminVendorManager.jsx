import React, { useEffect, useState } from 'react';
import { getApiBase } from '../api.js';

const AdminVendorManager = () => {
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
  fetch(`${getApiBase()}/vendors`)
      .then((res) => res.json())
      .then((data) => setVendors(data));
  }, []);

  const handleApprove = async (vendorId) => {
    try {
      const response = await fetch(`${getApiBase()}/vendors/${vendorId}/approve`, {
        method: 'PUT',
      });
      if (response.ok) {
        alert('Vendor approved successfully!');
        setVendors((prev) => prev.filter((vendor) => vendor._id !== vendorId));
      } else {
        alert('Failed to approve vendor.');
      }
    } catch (error) {
      console.error('Error approving vendor:', error);
    }
  };

  const handleDelete = async (vendorId) => {
    try {
      const response = await fetch(`${getApiBase()}/vendors/${vendorId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        alert('Vendor deleted successfully!');
        setVendors((prev) => prev.filter((vendor) => vendor._id !== vendorId));
      } else {
        alert('Failed to delete vendor.');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
    }
  };

  return (
    <div className="admin-vendor-manager">
      <h2>Manage Vendors</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <tr key={vendor._id}>
              <td>{vendor.name}</td>
              <td>{vendor.email}</td>
              <td>{vendor.phone}</td>
              <td>
                <button onClick={() => handleApprove(vendor._id)}>Approve</button>
                <button onClick={() => handleDelete(vendor._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminVendorManager;