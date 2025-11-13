import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import { useAuth } from './AuthContext.jsx';
import { getApiBase } from './api.js';
import CustomerAuth from './components/CustomerAuth';
import CustomerHome from './components/CustomerHome';
import CustomerDashboard from './components/CustomerDashboard';
import LoginSelector from './components/LoginSelector';
import VendorAuth from './components/VendorAuth';
import AdminAuth from './components/AdminAuth';
import { VendorDashboardProtected } from './components/VendorDashboard';
import AdminDashboard from './components/AdminDashboard';
import Home from './components/Home';
import VendorRegister from './components/VendorRegister';
import VendorManagement from './components/VendorManagement';
import CustomerManagement from './components/CustomerManagement';
import VendorDashboard from './components/VendorDashboard';

function App() {
  // App content with router context
  const AppContent = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, vendor, role, login, logout, setRole } = useAuth();

    const customer = role === 'customer' ? user : null;
    const admin = role === 'admin' ? user : null;

    // Restore role from localStorage on mount
    useEffect(() => {
      const savedRole = localStorage.getItem('role');
      console.log('[App] Restoring role from localStorage:', savedRole); // Debug log
      if (savedRole) {
        setRole(savedRole);
      }
    }, [setRole]);

    useEffect(() => {
      console.log('[App] Current role:', role); // Debug log
      console.log('[App] Current user:', user); // Debug log
      console.log('[App] Current vendor:', vendor); // Debug log
    }, [role, user, vendor]);

    // Customer authentication handler
    const handleCustomerAuth = (customerData) => {
      console.log('Customer authenticated:', customerData); // Debug logging
      login(customerData, 'customer');
    };

    const handleVendorAuth = (vendorData) => {
      login(vendorData, 'vendor');
    };

    const handleAdminAuth = (adminData) => {
      login(adminData, 'admin');
    };

    const handleLogout = (redirect = '/') => {
      logout();
      navigate(redirect);
    };



    // Define handleBack function
    const handleBack = () => {
      navigate(-1); // Go back one page in history
    };

    const isLoggedIn = role && user;

    return (
      <div style={{ fontFamily: 'sans-serif', padding: 24 }}>
        <h1>Milk Management System</h1>
        {isLoggedIn ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eaf6fb', padding: 12, borderRadius: 12, marginBottom: 32 }}>
            <strong style={{ color: '#1976d2', fontSize: 20 }}>
              {role === 'vendor' && vendor ? vendor.name : role === 'customer' && customer ? (customer.name || customer.phone || 'Customer') : role === 'admin' && admin ? (admin.name || 'Admin') : ''}
            </strong>
            <div>
              <button onClick={() => handleLogout('/')} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 600, cursor: 'pointer' }}>Logout</button>
            </div>
          </div>
        ) : null}
        <Routes>
          <Route path="/" element={isLoggedIn ? (role === 'customer' ? <Navigate to="/customer" /> : <Navigate to="/vendor" />) : <Home />} />
          <Route path="/customer/login" element={<CustomerAuth onAuth={handleCustomerAuth} />} />
          <Route path="/customer" element={
            role === 'customer' && customer && customer.vendorId && customer._id ? (
              <CustomerDashboard vendorId={customer.vendorId} customerId={customer._id} />
            ) : (
              <Navigate to="/customer/login" />
            )
          } />
          <Route path="/vendor/login" element={<VendorAuth onAuth={handleVendorAuth} />} />
          <Route path="/vendor/register" element={<VendorRegister />} />
          <Route path="/vendor" element={
            role === 'vendor' && vendor && vendor._id ? (
              <VendorDashboardProtected vendor={vendor} onBack={handleBack} onLogout={handleLogout} />
            ) : (
              <Navigate to="/vendor/login" />
            )
          } />
          <Route path="/admin/login" element={<AdminAuth onAuth={handleAdminAuth} />} />
          <Route path="/admin" element={
            admin ? <AdminDashboard admin={admin} onBack={handleBack} /> : <Navigate to="/admin/login" />
          } />
          <Route path="/admin/vendor-management" element={
            admin ? <VendorManagement admin={admin} /> : <Navigate to="/admin/login" />
          } />
          <Route path="/admin/customer-management" element={
            admin ? <CustomerManagement admin={admin} /> : <Navigate to="/admin/login" />
          } />
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    );
  }

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
