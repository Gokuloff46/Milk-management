import React, { useState } from 'react';

const menuItems = [
  { label: 'Home', tab: 'home' },
  { label: 'Customer Management', tab: 'customer' },
  { label: 'Milk Management', tab: 'milk' },
  { label: 'Product Management', tab: 'dairy' },
  { label: 'Cost Management', tab: 'cost' },
  { label: 'Sales', tab: 'sales' },
];

export default function MobileMenu({ activeTab, setActiveTab, onProfile, onLogout }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Open menu"
        style={{
          background: '#222',
          color: '#fff',
          border: 'none',
          fontSize: 28,
          position: 'fixed',
          top: 24,
          left: 24,
          zIndex: 3000,
          cursor: 'pointer',
          borderRadius: 8,
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
        onClick={() => setOpen(true)}
      >
        <span style={{ color: '#fff' }}>&#9776;</span>
      </button>
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '80vw',
            height: '100vh',
            background: '#fff',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            zIndex: 4000,
            padding: '32px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            minHeight: '100vh',
            overflow: 'hidden',
          }}
        >
          <button
            aria-label="Close menu"
            style={{
              background: '#222',
              color: '#fff',
              border: 'none',
              fontSize: 28,
              alignSelf: 'flex-end',
              marginBottom: 24,
              cursor: 'pointer',
              borderRadius: 8,
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
            onClick={() => setOpen(false)}
          >
            <span style={{ color: '#fff' }}>&#10005;</span>
          </button>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 24 }}>
            {menuItems.map(item => (
              <button
                key={item.tab}
                style={{
                  background: activeTab === item.tab ? '#f7b7a3' : 'none',
                  border: 'none',
                  fontSize: 20,
                  padding: '12px 0',
                  textAlign: 'left',
                  width: '100%',
                  cursor: 'pointer',
                  color: '#222',
                  fontWeight: activeTab === item.tab ? 'bold' : 'normal',
                }}
                onClick={() => {
                  setActiveTab(item.tab);
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '0 0 12px 0' }} />
          <div style={{
            width: '100%',
            background: '#fff',
            paddingBottom: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <button
              onClick={() => { setOpen(false); onProfile && onProfile(); }}
              style={{
                background: 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '14px 0',
                fontSize: 20,
                fontWeight: 700,
                width: '100%',
                cursor: 'pointer',
                boxShadow: '0 2px 8px #3a7bd522',
              }}
            >
              Profile
            </button>
            <button
              onClick={() => { setOpen(false); onLogout && onLogout(); }}
              style={{
                background: '#3a7bd5',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '14px 0',
                fontSize: 20,
                fontWeight: 700,
                width: '100%',
                cursor: 'pointer',
                boxShadow: '0 2px 8px #3a7bd522',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
