import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VendorAuth.css';

import { getApiBase } from '../api.js';
const API = `${getApiBase()}/customers`;

export default function CustomerAuth({ onAuth }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobile: '', otp: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [demoOtp, setDemoOtp] = useState(null);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  function validateMobile(v) {
    return /^\d{10}$/.test(v) ? '' : 'Enter a 10-digit mobile number';
  }

  function validatePin(v) {
    return /^\d{4,6}$/.test(v) ? '' : 'Enter a 4-6 digit PIN';
  }

  const handleSendOtp = async () => {
    setError('');
    const mErr = validateMobile(form.mobile);
    setFieldErrors({ mobile: mErr });
    if (mErr) return;
    try {
      console.log('Sending OTP for mobile:', form.mobile);
      const res = await fetch(`${API}/send-otp`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ mobile: form.mobile }) 
      });
      
      console.log('Response status:', res.status, 'ok:', res.ok);
      const data = await res.json();
      console.log('Full OTP Response:', JSON.stringify(data));
      console.log('demoOtp value:', data.demoOtp);
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      
      // Demo mode: show OTP returned by server
      if (data.demoOtp) {
        console.log('✓ Demo OTP received:', data.demoOtp);
        console.log('Setting demoOtp state to:', data.demoOtp);
        setDemoOtp(data.demoOtp);
        // Force alert for testing
        alert('OTP Sent: ' + data.demoOtp);
      } else {
        console.warn('⚠ No demoOtp in response');
      }
    } catch (err) {
      console.error('OTP Error:', err);
      setError(err.message);
    }
  };

  const handleVerifyOtp = async e => {
    e.preventDefault();
    setError('');
    const mErr = validateMobile(form.mobile);
    const oErr = form.otp && form.otp.length >= 4 ? '' : 'Enter the OTP';
    setFieldErrors({ mobile: mErr, otp: oErr });
    if (mErr || oErr) return;
    try {
      const res = await fetch(`${API}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: form.mobile, otp: form.otp })
      });
      const data = await res.json();
      console.log('Server response:', data); // Debug logging
      if (!res.ok) throw new Error(data.error || 'OTP verification failed');
      const customer = {
        _id: data.customer?._id || data._id,
        vendorId: data.customer?.vendorId || data.vendorId,
        ...data.customer || data
      };
      const token = data.token;
      if (token) {
        localStorage.setItem('token', token); // Ensure token is stored correctly
        localStorage.setItem('customer', JSON.stringify(customer));
      }
      console.log('[CustomerAuth] Logging in customer:', customer); // Debug log
      console.log('[CustomerAuth] Setting role to customer'); // Debug log
      onAuth(data.customer);
      navigate('/customer');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="vendor-login-root">
      <div className="vendor-login-card">
        <h2 className="vendor-login-title">Customer Login</h2>
        <p className="vendor-login-subtitle">Use your mobile number to sign in</p>

        <div>
          {/* Mobile Input and Send OTP Button */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input 
              name="mobile" 
              placeholder="Mobile (10 digits)" 
              value={form.mobile} 
              onChange={e => { handleChange(e); setFieldErrors(f => ({ ...f, mobile: validateMobile(e.target.value) })); }} 
              className="vendor-login-input" 
              required 
            />
            <button 
              type="button"
              className="vendor-login-btn primary" 
              onClick={handleSendOtp}
              style={{ padding: '8px 16px' }}
            >
              Send OTP
            </button>
          </div>
          {fieldErrors.mobile && <div className="vendor-field-error">{fieldErrors.mobile}</div>}
          
          {/* OTP Verification Form */}
          <form onSubmit={handleVerifyOtp} className="vendor-login-form" style={{ marginTop: 12 }}>
            <input 
              name="otp" 
              placeholder="Enter OTP" 
              value={form.otp} 
              onChange={e => { handleChange(e); setFieldErrors(f => ({ ...f, otp: '' })); }} 
              className="vendor-login-input" 
              required 
            />
            {fieldErrors.otp && <div className="vendor-field-error">{fieldErrors.otp}</div>}
            <button type="submit" className="vendor-login-btn primary">Verify & Login</button>
          </form>
          
          {/* Demo OTP Display */}
          {demoOtp && (
            <div style={{ 
              marginTop: 12, 
              padding: 12, 
              backgroundColor: '#e3f2fd', 
              borderRadius: 8, 
              color: '#1976d2',
              fontWeight: 600,
              textAlign: 'center',
              border: '2px solid #1976d2'
            }}>
              ✓ Demo OTP: <span style={{fontSize: '1.2em'}}>{demoOtp}</span>
            </div>
          )}
          
          {error && (
            <div style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: '#ffebee',
              borderRadius: 8,
              color: '#d32f2f',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              Error: {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 12 }}>
          <button type="button" className="vendor-login-btn secondary" style={{ width: '48%' }} onClick={() => navigate('/')}>Back</button>
          <a className="vendor-forgot" href={"mailto:support@milk.local?subject=Forgot%20Password"} style={{ width: '48%', textAlign: 'center', alignSelf: 'center', textDecoration: 'none', color: 'var(--accent-1)', fontWeight: 700 }}>Help</a>
        </div>

        {error && <div className="vendor-login-error">{error}</div>}
      </div>
    </div>
  );
}
