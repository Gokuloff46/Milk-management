import React, { useEffect, useState } from 'react';
import './SupplierManager.css';
import { fetchSuppliers, addSupplier, updateSupplier, deleteSupplier } from '../api';

export default function SupplierManager() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ name: '', contact: '', address: '' });
  const [editing, setEditing] = useState(null);

  // Hamburger menu state and items
  const [menuOpen, setMenuOpen] = useState(false);
  const MENU_ITEMS = [
    { key: 'home', label: 'Home' },
    { key: 'milk', label: 'Milk Management' },
    { key: 'dairy', label: 'Product Management' },
    { key: 'sales', label: 'Sales Management' },
    { key: 'cost', label: 'Cost Management' },
    { key: 'customer', label: 'Customer Management' }
  ];
  useEffect(() => { fetchSuppliers().then(setSuppliers); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await updateSupplier(editing, form);
    } else {
      await addSupplier(form);
    }
    setForm({ name: '', contact: '', address: '' });
    setEditing(null);
    fetchSuppliers().then(setSuppliers);
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditing(item._id);
  };

  const handleDelete = async (id) => {
    await deleteSupplier(id);
    fetchSuppliers().then(setSuppliers);
  };

  return (
    <div className="supplier-manager-root">
      <button className="hamburger-menu-btn" onClick={() => setMenuOpen(true)}>
        <span style={{fontSize: '2rem'}}>&#9776;</span>
      </button>
      {menuOpen && (
        <div className="side-menu-overlay" onClick={() => setMenuOpen(false)} />
      )}
      <nav className={`side-menu${menuOpen ? ' open' : ''}`}>
        <button className="close-menu-btn" onClick={() => setMenuOpen(false)}>
          <span style={{fontSize: '2rem'}}>&#10005;</span>
        </button>
        <ul>
          {MENU_ITEMS.map(item => (
            <li key={item.key}>
              <button className="side-menu-item" onClick={() => {/* handle navigation */ setMenuOpen(false); }}>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <form onSubmit={handleSubmit} className="supplier-manager-form">
        <input className="supplier-manager-input" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input className="supplier-manager-input" placeholder="Contact" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
        <input className="supplier-manager-input" placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        <button type="submit" className="supplier-manager-btn">{editing ? 'Update' : 'Add'}</button>
        {editing && <button type="button" className="supplier-manager-btn cancel" onClick={() => { setEditing(null); setForm({ name: '', contact: '', address: '' }); }}>Cancel</button>}
      </form>
      <div className="supplier-manager-table-wrapper">
        <table className="supplier-manager-table" border="1" cellPadding="6">
          <thead><tr className="supplier-manager-table-header"><th>Name</th><th>Contact</th><th>Address</th><th>Actions</th></tr></thead>
          <tbody>
            {suppliers.map(item => (
              <tr key={item._id} className="supplier-manager-table-row">
                <td>{item.name}</td>
                <td>{item.contact}</td>
                <td>{item.address}</td>
                <td>
                  <button className="supplier-manager-btn" onClick={() => handleEdit(item)}>Edit</button>
                  <button className="supplier-manager-btn cancel" onClick={() => handleDelete(item._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
