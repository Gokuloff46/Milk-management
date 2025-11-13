

import React from 'react';
import { Navigate } from 'react-router-dom';

// Usage: <RequireAuth><ProtectedComponent /></RequireAuth>
export default function RequireAuth({ children }) {
  const isLoggedIn = !!localStorage.getItem('token');
  if (!isLoggedIn) {
    return <Navigate to="/vendor/login" replace />;
  }
  return children;
}
