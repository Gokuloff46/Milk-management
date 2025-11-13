import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Initialize from localStorage so AuthContext stays in sync with App's persisted state
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('user');
      console.log('AuthContext: Initializing user from localStorage:', s);
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  });
  const [vendor, setVendor] = useState(() => {
    try {
      const v = localStorage.getItem('vendor');
      console.log('AuthContext: Initializing vendor from localStorage:', v);
      return v ? JSON.parse(v) : null;
    } catch (e) {
      return null;
    }
  });
  const [role, setRole] = useState(() => {
    const r = localStorage.getItem('role') || '';
    console.log('AuthContext: Initializing role from localStorage:', r);
    return r;
  });

  const login = (userData, userRole) => {
    console.log('AuthContext: login called with userData:', userData, 'and userRole:', userRole);
    setUser(userData);
    setRole(userRole);

    // Clear unrelated data
    if (userRole === 'customer') {
      setVendor(null);
      localStorage.removeItem('vendor');
    } else if (userRole === 'vendor') {
      setUser(null);
      localStorage.removeItem('user');
    }

    try {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userRole);
      console.log('AuthContext: localStorage updated after login.');
    } catch (e) {
      // ignore localStorage errors
    }
  };

  const logout = () => {
    console.log('AuthContext: logout called.');
    setUser(null);
    setVendor(null);
    setRole('');
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('vendor');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      console.log('AuthContext: localStorage cleared after logout.');
    } catch (e) {}
  };

  // Keep localStorage synced if other parts of the app update vendor/user
  useEffect(() => {
    console.log('AuthContext: user state changed:', user);
    try {
      if (user) localStorage.setItem('user', JSON.stringify(user));
      else localStorage.removeItem('user');
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    console.log('AuthContext: vendor state changed:', vendor);
    try {
      if (vendor) localStorage.setItem('vendor', JSON.stringify(vendor));
      else localStorage.removeItem('vendor');
    } catch (e) {}
  }, [vendor]);

  return (
    <AuthContext.Provider value={{ user, vendor, role, login, logout, setUser, setVendor, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}