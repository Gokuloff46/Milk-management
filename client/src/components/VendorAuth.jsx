import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VendorAuth.css';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiBase } from '../api.js';
import { useAuth } from '../AuthContext.jsx';

// Use centralized API base resolver
const API_BASE = getApiBase();

export default function VendorAuth({ onAuth }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  function validateField(name, value) {
    if (name === 'email') {
      if (!value) return 'Email is required';
      const ok = /\S+@\S+\.\S+/.test(value);
      return ok ? '' : 'Enter a valid email';
    }
    if (name === 'password') {
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
      return '';
    }
    return '';
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    // client-side validation
    const fe = {};
    Object.keys(form).forEach(k => { fe[k] = validateField(k, form[k]); });
    setFieldErrors(fe);
    if (Object.values(fe).some(v => v)) return;
    try {
  const res = await fetch(`${API_BASE}/vendors/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  // Ensure explicit approved status (backend returns vendor.status)
  if (data.status && data.status !== 'approved') throw new Error('Account not approved');
      // Set token in localStorage for RequireAuth
      if (data.token) {
        localStorage.setItem('token', data.token);
      } else {
        // fallback: set a dummy token if not provided
        localStorage.setItem('token', 'vendor-logged-in');
      }
  onAuth(data.vendor);
  // also update context so components relying on useAuth() (like MilkManager) get the vendor
  if (auth && auth.setVendor) auth.setVendor(data);
  console.log('[VendorAuth] set vendor in AuthContext:', data && data._id);
  console.log('[VendorAuth] Logging in vendor:', data.vendor); // Debug log
  console.log('[VendorAuth] Setting role to vendor'); // Debug log
      setLoginSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // After loginSuccess, navigate to /vendor
  React.useEffect(() => {
    if (loginSuccess) {
      navigate('/vendor');
    }
  }, [loginSuccess, navigate]);

  return (
    <div className="vendor-login-root">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="vendor-login-card"
      >
        <h2 className="vendor-login-title">Vendor Login</h2>
        <p className="vendor-login-subtitle">Sign in to manage your vendor account</p>
        <form onSubmit={handleSubmit} className="vendor-login-form">
          <motion.input aria-label="Email" name="email" placeholder="Email" value={form.email} onChange={e => { handleChange(e); setFieldErrors(f => ({ ...f, email: validateField('email', e.target.value) })); }} required className="vendor-login-input" />
          {fieldErrors.email && <div className="vendor-field-error">{fieldErrors.email}</div>}
          <motion.input aria-label="Password" name="password" type="password" placeholder="Password" value={form.password} onChange={e => { handleChange(e); setFieldErrors(f => ({ ...f, password: validateField('password', e.target.value) })); }} required className="vendor-login-input" />
          {fieldErrors.password && <div className="vendor-field-error">{fieldErrors.password}</div>}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            className="vendor-login-btn primary"
          >
            Login
          </motion.button>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              className="vendor-login-btn secondary"
              style={{ width: '48%' }}
              onClick={() => navigate('/vendor/register')}
            >
              Register
            </motion.button>
            <a className="vendor-forgot" href={"mailto:support@milk.local?subject=Forgot%20Password"} style={{ width: '48%', textAlign: 'center', alignSelf: 'center', textDecoration: 'none', color: 'var(--accent-1)', fontWeight: 700 }}>Forgot password?</a>
          </div>
        </form>
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="vendor-login-error"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
