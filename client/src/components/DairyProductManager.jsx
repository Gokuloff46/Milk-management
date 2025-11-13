import React, { useState, useEffect } from 'react';
import './DairyProductManager.css';
import { getApiBase } from '../api.js';

function getPeriodDates(period) {
  const now = new Date();
  let start, end;
  end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (period === 'daily') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'weekly') {
    const day = now.getDay();
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  } else if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'yearly') {
    start = new Date(now.getFullYear(), 0, 1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return { start, end };
}

export default function DairyProductManager({ products: initialProducts, period = 'daily', vendor = null }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [form, setForm] = useState({ name: '', price: '', unit: '', capacity: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  const url = vendor && vendor._id ? `${getApiBase()}/products?vendor=${vendor._id}` : `${getApiBase()}/products`;
    fetch(url)
      .then(res => res.json())
      .then(res => setProducts(Array.isArray(res) ? res : (Array.isArray(res.products) ? res.products : [])))
      .catch(() => setProducts([]));
  }, [vendor]);

  async function addProduct(product) {
    // Ensure capacity is sent and is a number
    const base = {
      name: product.name,
      price: Number(product.price),
      unit: product.unit,
      capacity: Number(product.capacity)
    };
    const finalPayload = vendor && vendor._id ? { ...base, vendor: vendor._id } : base;
    const res = await fetch(`${getApiBase()}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalPayload)
    });
    if (!res.ok) throw new Error('Failed to add product');
    return await res.json();
  }
  async function updateProduct(id, product) {
    const res = await fetch(`${getApiBase()}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Failed to update product');
  }
  async function deleteProduct(id) {
    const res = await fetch(`${getApiBase()}/products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete product');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!form.name || !form.price || !form.unit) {
      setError('Please fill all fields.');
      setLoading(false);
      return;
    }
    try {
      if (editing) {
        await updateProduct(editing, form);
      } else {
        await addProduct(form);
      }
      setForm({ name: '', price: '', unit: '' });
      setEditing(null);
      window.location.reload();
    } catch (err) {
      setError('Error: ' + (err.message || err));
    }
    setLoading(false);
  };

  const handleEdit = (item) => {
    setForm({
      name: item.name,
      price: item.price,
      unit: item.unit
    });
    setEditing(item._id);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await deleteProduct(id);
      window.location.reload();
    } catch (err) {
      setError('Error: ' + (err.message || err));
    }
    setLoading(false);
  };

  // Show all products, no date filtering
  const filteredProducts = products;

  return (
    <div className="dairy-product-manager-root">
      <div className="dairy-product-manager-card">
        <h2 className="dairy-product-manager-title">Dairy Product Management</h2>
        <form className="dairy-product-manager-form" onSubmit={handleSubmit}>
          <input className="dairy-product-manager-input" type="text" name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product Name" />
          <input className="dairy-product-manager-input" type="number" name="price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price" />
          <input className="dairy-product-manager-input" type="number" name="capacity" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="Capacity" />
          <input className="dairy-product-manager-input" type="text" name="unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="Unit (e.g. liter, kg)" />
          <button className="dairy-product-manager-btn" type="submit" disabled={loading}>{editing ? 'Update' : loading ? 'Saving...' : 'Add Product'}</button>
        </form>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <div className="dairy-product-manager-table-wrapper">
          <table className="dairy-product-manager-table">
            <thead className="dairy-product-manager-table-header">
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Unit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(item => (
                <tr key={item._id} className="dairy-product-manager-table-row">
                  <td>{item.name}</td>
                  <td>{item.price}</td>
                  <td>{item.unit}</td>
                  <td>
                    <button className="dairy-product-manager-btn" onClick={() => handleEdit(item)} style={{ marginRight: 8 }}>Edit</button>
                    <button className="dairy-product-manager-btn" onClick={() => handleDelete(item._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
