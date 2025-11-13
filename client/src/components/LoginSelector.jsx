import React, { useState } from 'react';
import BackButton from './BackButton';
import VendorRegister from './VendorRegister';

export default function LoginSelector({ onSelect }) {
  const [showVendorRegister, setShowVendorRegister] = useState(false);

  if (showVendorRegister) {
    return <VendorRegister onRegistered={() => setShowVendorRegister(false)} />;
  }

  return (
    <div style={{ maxWidth: 320, margin: '40px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      {/* Removed bottom BackButton */}
      <h2>Login As</h2>
      <button style={{ margin: 8, width: '100%' }} onClick={() => onSelect('customer')}>Customer</button>
      <button style={{ margin: 8, width: '100%' }} onClick={() => onSelect('vendor')}>Vendor</button>
      <button style={{ margin: 8, width: '100%' }} onClick={() => onSelect('admin')}>Admin</button>
      <button style={{ margin: 8, width: '100%' }} onClick={() => setShowVendorRegister(true)}>Register as Vendor</button>
    </div>
  );
}
