import React, { useEffect, useState } from 'react';
import { fetchMilk, fetchProducts, fetchSales, fetchCustomers } from '../api';
import ProfileEditor from './ProfileEditor';
import MobileMenu from './MobileMenu';
import { Bar } from 'react-chartjs-2';
import MilkManager from './MilkManager';
import CustomerManager from './CustomerManager';
import DairyProductManager from './DairyProductManager';
import CostManager from './CostManager';
import SalesManager from './SalesManager';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

function getPeriodDates(period) {
  const now = new Date();
  let start, end;
  end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (period === 'daily') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'weekly') {
    const day = now.getDay();
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  } else if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'yearly') {
    start = new Date(now.getFullYear(), 0, 1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return { start, end };
}

export default function Home() {
  return (
    <div style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ marginTop: 8 }}>Welcome to Milk Management System</h1>
      <p style={{ maxWidth: 360 }}>Please select your login type:</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 28, width: '100%', alignItems: 'center' }}>
        <a href="/customer/login" style={{ width: '80%', maxWidth: 320 }}>
          <button style={{ width: '100%', background: '#fda085', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>Customer Login</button>
        </a>
        <a href="/vendor/login" style={{ width: '80%', maxWidth: 320 }}>
          <button style={{ width: '100%', background: '#fda085', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>Vendor Login</button>
        </a>
        <a href="/admin/login" style={{ width: '80%', maxWidth: 320 }}>
          <button style={{ width: '100%', background: '#fda085', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 18, cursor: 'pointer' }}>Admin Login</button>
        </a>
      </div>
    </div>
  );
}
