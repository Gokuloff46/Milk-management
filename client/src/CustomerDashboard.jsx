
import React from 'react';
import { useAuth } from './AuthContext';
import CustomerHome from './CustomerHome';
import BackButton from './components/BackButton';

const CustomerDashboard = () => {
  const { user: customer } = useAuth();

  if (!customer) {
    return (
      <div>
        <h2>Please Log In</h2>
        <p>You need to be logged in to view this page.</p>
        <BackButton />
      </div>
    );
  }

  return (
    <div>
      <CustomerHome customer={customer} onBack={() => window.history.back()} />
    </div>
  );
};

export default CustomerDashboard;
