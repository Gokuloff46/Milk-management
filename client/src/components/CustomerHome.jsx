import React from 'react';
import './CustomerHome.css';
import CustomerSummary from './CustomerSummary';
import BackButton from './BackButton';

export default function CustomerHome({ customer, onBack }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('summary');
  const menuItems = [
    { key: 'summary', label: 'Summary' },
    { key: 'info', label: 'Info' }
  ];
  return (
    <div className="customer-home-root">
      <div className="customer-home-menu-bar">
        <button className="customer-home-menu-btn" onClick={() => setMenuOpen(m => !m)}>
          &#9776; Menu
        </button>
        {menuOpen && (
          <div className="customer-home-menu-dropdown">
            {menuItems.map(tab => (
              <button
                key={tab.key}
                className={`customer-home-menu-item${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  setMenuOpen(false);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="customer-home-card">
        {activeTab === 'summary' && <CustomerSummary customer={customer} />}
        {activeTab === 'info' && (
          <>
            <h2 className="customer-home-title">Welcome, {customer.name}!</h2>
            <p className="customer-home-info">Email: {customer.email}</p>
            <p className="customer-home-info">Address: {customer.address}</p>
            <p className="customer-home-info">Phone: {customer.phone}</p>
          </>
        )}
      </div>
    </div>
  );
}
