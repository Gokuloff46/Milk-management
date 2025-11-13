import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VendorAuth.css';
import { getApiBase } from '../api.js';

const API = `${getApiBase()}/admin/login`;

export default function AdminAuth({ onAuth }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(''); 
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  function validateField(name, value) {
    if (name === 'username') return value.length >= 3 ? '' : 'Enter a username';
    if (name === 'password') return value.length >= 6 ? '' : 'Password too short';
    return '';
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const fe = {};
    Object.keys(form).forEach(k => fe[k] = validateField(k, form[k]));
    setFieldErrors(fe);
    if (Object.values(fe).some(v => v)) return;
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      // data: { token, username }
      localStorage.setItem('adminToken', data.token);
      onAuth({ username: data.username, token: data.token });
      navigate('/admin');
    } catch (err) {
      // Network errors (server down / CORS) often surface as TypeError with message 'Failed to fetch'
      const msg = err && err.message ? err.message : String(err);
      if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('Network request failed')) {
        setError(`Cannot reach backend at ${API}. Is the server running?`);
      } else {
        setError(msg);
      }
    }
  };

  return (
    <div className="vendor-login-root">
      <div className="vendor-login-card">
        <h2 className="vendor-login-title">Admin Login</h2>
        <p className="vendor-login-subtitle">Administrator access</p>
        <form onSubmit={handleSubmit} className="vendor-login-form">
          <input name="username" placeholder="Username" value={form.username} onChange={e => { handleChange(e); setFieldErrors(f => ({ ...f, username: validateField('username', e.target.value) })); }} className="vendor-login-input" required />
          {fieldErrors.username && <div className="vendor-field-error">{fieldErrors.username}</div>}
          <input name="password" placeholder="Password" type="password" value={form.password} onChange={e => { handleChange(e); setFieldErrors(f => ({ ...f, password: validateField('password', e.target.value) })); }} className="vendor-login-input" required />
          {fieldErrors.password && <div className="vendor-field-error">{fieldErrors.password}</div>}
          <button type="submit" className="vendor-login-btn primary">Login</button>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
            <button type="button" className="vendor-login-btn secondary" style={{ width: '48%' }} onClick={() => navigate('/')}>Back</button>
            <a className="vendor-forgot" href={"mailto:support@milk.local?subject=Admin%20Forgot%20Password"} style={{ width: '48%', textAlign: 'center', alignSelf: 'center', textDecoration: 'none', color: 'var(--accent-1)', fontWeight: 700 }}>Forgot password?</a>
          </div>
        </form>
        {error && <div className="vendor-login-error">{error}</div>}
      </div>
    </div>
  );
}
