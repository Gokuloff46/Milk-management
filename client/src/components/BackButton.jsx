import React from 'react';

export default function BackButton({ onBack, style }) {
  return (
    <button
      onClick={onBack}
      style={{
        marginBottom: 16,
        padding: '8px 16px',
        borderRadius: 8,
        border: 'none',
        background: 'linear-gradient(90deg, #f6d365 0%, #fda085 100%)',
        color: '#fff',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        ...style
      }}
    >
      ← Back
    </button>
  );
}
