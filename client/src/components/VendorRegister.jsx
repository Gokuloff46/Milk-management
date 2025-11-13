import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { getApiBase } from '../api.js';
const API = `${getApiBase()}/vendors/register`;

export default function VendorRegister({ onRegistered }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '', phone: '', photo: null });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setSuccess(true);
      if (onRegistered) onRegistered();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
  <div className="vendor-register-root">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
  className="vendor-register-card"
      >
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Vendor Registration</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <motion.input name="name" placeholder="Name" value={form.name} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #eee' }} />
          <motion.input name="email" placeholder="Email" value={form.email} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #eee' }} />
          <motion.input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #eee' }} />
          <motion.input name="address" placeholder="Address" value={form.address} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #eee' }} />
          <motion.input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required style={{ padding: 10, borderRadius: 8, border: '1px solid #eee' }} />
          <motion.input
            name="photo"
            type="file"
            accept="image/*"
            onChange={(e) => setForm({ ...form, photo: e.target.files[0] })}
            required
            style={{ padding: 10, borderRadius: 8, border: '1px solid #eee' }}
          />
          <motion.button
            className="vendor-register-btn"
            type="submit"
            whileHover={{ scale: 1.05, backgroundColor: '#fda085' }}
            style={{ padding: 12, borderRadius: 8, border: 'none', background: '#f6d365', color: '#fff', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            Register
          </motion.button>
        </form>
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="vendor-register-error"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="vendor-register-success"
            >
              Registration successful! Awaiting admin approval.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
