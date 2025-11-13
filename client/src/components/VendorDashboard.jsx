import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import './VendorDashboard.css';
import { getApiBase } from '../api.js';
import MilkManager from './MilkManager';
import DairyProductManager from './DairyProductManager';
import CustomerManager from './CustomerManager';
import Home from './Home';
import CostManager from './CostManager';
import MobileMenu from './MobileMenu';
import RequireAuth from './RequireAuth';
import SalesManager from './SalesManager';

export default function VendorDashboard({ vendor, onBack, onLogout }) {
  console.log('[VendorDashboard] Rendering...');
  const today = new Date().toISOString().split('T')[0];
  const vendorId = vendor && vendor._id ? vendor._id : null;
  const [activeTab, setActiveTab] = useState('home');
  const [milk, setMilk] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  // Always show weekly report in Home dashboard
  const [period, setPeriod] = useState('weekly');

  // SalesManager state
  const [form, setForm] = useState({ productId: '', customer: '', quantity: '', total: '', date: today });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);

  // New state variables for dashboard cards
  const [milkPrice, setMilkPrice] = useState(0);
  const [totalMilkDaily, setTotalMilkDaily] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [todaysMilk, setTodaysMilk] = useState([]);

  useEffect(() => {
    const vendorId = vendor && vendor._id ? vendor._id : null;
    if (!vendorId) return;

    const fetchData = async () => {
      try {
        const [milkRes, productsRes, salesRes, customersRes, milkPriceRes, todaysMilkRes, customerCountRes] = await Promise.all([
          fetch(vendorId ? `${getApiBase()}/vendors/${vendorId}/milk` : `${getApiBase()}/milk`),
          fetch(vendorId ? `${getApiBase()}/products?vendor=${vendorId}` : `${getApiBase()}/products`),
          fetch(vendorId ? `${getApiBase()}/vendors/${vendorId}/customer-payments` : `${getApiBase()}/sales`),
          fetch(`${getApiBase()}/vendors/${vendorId}/customers`),
          fetch(`${getApiBase()}/vendors/${vendorId}/milk-price`),
          fetch(`${getApiBase()}/vendors/${vendorId}/milk/today`),
          fetch(`${getApiBase()}/vendors/${vendorId}/customers/count`)
        ]);

        const milkData = await milkRes.json();
        setMilk(Array.isArray(milkData) ? milkData : (Array.isArray(milkData.milk) ? milkData.milk : []));

        const productsData = await productsRes.json();
        setProducts(Array.isArray(productsData) ? productsData : (Array.isArray(productsData.products) ? productsData.products : []));

        const salesData = await salesRes.json();
        setSales(Array.isArray(salesData) ? salesData : (Array.isArray(salesData.sales) ? salesData.sales : []));

        const customersData = await customersRes.json();
        setCustomers(Array.isArray(customersData) ? customersData : []);

        const milkPriceData = await milkPriceRes.json();
        setMilkPrice(milkPriceData.price || 0);

        const todaysMilkData = await todaysMilkRes.json();
        setTodaysMilk(Array.isArray(todaysMilkData) ? todaysMilkData : []);

        const dailyTotal = todaysMilkData.reduce((acc, item) => acc + item.liter, 0);
        setTotalMilkDaily(dailyTotal);

        const dailyCost = todaysMilkData.reduce((acc, item) => acc + item.price, 0);
        setTotalCost(dailyCost);

        const customerCountData = await customerCountRes.json();
        setCustomerCount(customerCountData.count || 0);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [vendor]);

  useEffect(() => {
    if (!form.productId || !form.quantity) {
      setForm(f => ({ ...f, total: '' }));
      return;
    }
    const product = products.find(p => p._id === form.productId);
    if (product) {
      const qty = parseFloat(form.quantity);
      const price = parseFloat(product.price);
      if (!isNaN(qty) && !isNaN(price)) {
        setForm(f => ({ ...f, total: (qty * price).toFixed(2) }));
      }
    }
  }, [form.productId, form.quantity, products]);

  async function addSale(sale) {
    const payload = vendorId ? { ...sale, vendor: vendorId } : sale;
  const res = await fetch(`${getApiBase()}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to add sale');
    return await res.json();
  }
  async function updateSale(id, sale) {
  const res = await fetch(`${getApiBase()}/sales/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale)
    });
    if (!res.ok) throw new Error('Failed to update sale');
  }
  async function deleteSale(id) {
  const res = await fetch(`${getApiBase()}/sales/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete sale');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!form.productId || !form.customer || !form.quantity) {
      setError('Please fill all fields.');
      setLoading(false);
      return;
    }
    try {
      if (editing) {
        await updateSale(editing, form);
      } else {
        await addSale(form);
      }
      setForm({ productId: '', customer: '', quantity: '', total: '', date: today });
      setEditing(null);
      // Instead of reloading, update sales state locally (use vendor-scoped list)
  const listUrl = vendorId ? `${getApiBase()}/vendors/${vendorId}/customer-payments` : `${getApiBase()}/sales`;
  const res = await fetch(listUrl);
      const updatedSales = await res.json();
      setSales(Array.isArray(updatedSales) ? updatedSales : (Array.isArray(updatedSales.sales) ? updatedSales.sales : []));
    } catch (err) {
      setError('Error: ' + (err.message || err));
    }
    setLoading(false);
  };

  const handleEdit = (item) => {
    setForm({
      productId: item.productId,
      customer: item.customer,
      quantity: item.quantity,
      total: item.total,
      date: item.date ? item.date.split('T')[0] : today
    });
    setEditing(item._id);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await deleteSale(id);
      // Instead of reloading, update sales state locally (use vendor-scoped list)
  const listUrl = vendorId ? `${getApiBase()}/vendors/${vendorId}/customer-payments` : `${getApiBase()}/sales`;
  const res = await fetch(listUrl);
      const updatedSales = await res.json();
      setSales(Array.isArray(updatedSales) ? updatedSales : (Array.isArray(updatedSales.sales) ? updatedSales.sales : []));
    } catch (err) {
      setError('Error: ' + (err.message || err));
    }
    setLoading(false);
  };

  // Print bill function
  function handlePrintBill(sale, productName) {
    const billHtml = `
      <div style='font-family: Arial; padding: 24px;'>
        <h2>Milk Management Bill</h2>
        <hr />
        <div><strong>Product:</strong> ${productName}</div>
        <div><strong>Customer:</strong> ${sale.customer}</div>
        <div><strong>Quantity:</strong> ${sale.quantity}</div>
        <div><strong>Date:</strong> ${sale.date ? new Date(sale.date).toLocaleDateString() : ''}</div>
        <div><strong>Total:</strong> ₹${sale.total}</div>
        <hr />
        <div style='margin-top:16px;'>Thank you for your purchase!</div>
      </div>
    `;
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(`<html><head><title>Print Bill</title></head><body>${billHtml}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
  const handleShareBill = async (customer) => {
    try {
      const response = await fetch(`${getApiBase()}/milk/customer/${customer._id}/bill?period=monthly`);
      const bill = await response.json();

      const billDetails = `
        Hello ${customer.name},
        Here is your milk bill details for this month:
        Total Milk: ${bill.totalLiter} liters
        Total Amount: ₹${bill.totalAmount}
      `;

      const whatsappUrl = `https://wa.me/${customer.phone}?text=${encodeURIComponent(billDetails)}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error fetching milk bill:', error);
    }
  };

  const chartData = {
    labels: ['Milk Status', 'Sales Status'],
    datasets: [
      {
        data: [70, 30], // Example data
        backgroundColor: ['#4caf50', '#ff5722'],
      },
    ],
  };

  let content = null;
  if (activeTab === 'customer') {
    content = <CustomerManager vendor={vendor} customers={customers} vendorPeriod={period} />;
  } else if (activeTab === 'milk') {
    content = <MilkManager milk={milk} period={period} vendor={vendor} />;
  } else if (activeTab === 'dairy') {
    content = <DairyProductManager products={products} period={period} vendor={vendor} />;
  } else if (activeTab === 'cost') {
    content = <CostManager period={period} vendor={vendor} />;
  } else if (activeTab === 'sales') {
    content = (
      <div>
        <div style={{color: '#e53935', fontWeight: 600, padding: 16, textAlign: 'center', border: '2px dashed #3a7bd5', marginBottom: 16}}>
          Debug: VendorDashboard sales tab is active. If you see this, SalesManager should render below.<br />
          Products: {products.length}, Sales: {sales.length}
        </div>
  <SalesManager products={products} sales={sales} vendor={vendor} />
      </div>
    );
  } else {
    content = (
      <div className="vendor-dashboard">
      <h1>Milk Management System</h1>
      <h2>Vendor Dashboard</h2>
      <div className="cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <div className="card" style={{ backgroundColor: '#e0f7fa', borderRadius: '10px', padding: '15px', color: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', margin: '0' }}>{milkPrice}</h3>
          <p style={{ fontSize: '0.9rem', margin: '0' }}>Milk Price</p>
        </div>
        <div className="card" style={{ backgroundColor: '#fce4ec', borderRadius: '10px', padding: '15px', color: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', margin: '0' }}>{totalMilkDaily}</h3>
          <p style={{ fontSize: '0.9rem', margin: '0' }}>Total Milk Daily</p>
        </div>
        <div className="card" style={{ backgroundColor: '#fff3e0', borderRadius: '10px', padding: '15px', color: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', margin: '0' }}>{totalCost}</h3>
          <p style={{ fontSize: '0.9rem', margin: '0' }}>Total Cost</p>
        </div>
        <div className="card" style={{ backgroundColor: '#e8eaf6', borderRadius: '10px', padding: '15px', color: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', margin: '0' }}>{customerCount}</h3>
          <p style={{ fontSize: '0.9rem', margin: '0' }}>Total Customers</p>
        </div>
      </div>
      <div className="chart">
        <h2>Status Chart</h2>
        <Pie data={{
          labels: ['Milk Status', 'Sales Status'],
          datasets: [
            {
              data: [70, 30],
              backgroundColor: ['#4caf50', '#ff5722'],
            },
          ],
        }} />
      </div>
      <div className="customer-list">
        <h2>Today's Milk</h2>
        <table>
          <thead>
            <tr>
              <th>Liters</th>
              <th>Price</th>
              <th>Session</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {todaysMilk.map((milkEntry) => (
              <tr key={milkEntry._id}>
                <td>{milkEntry.liter}</td>
                <td>{milkEntry.price}</td>
                <td>{milkEntry.session}</td>
                <td>{new Date(milkEntry.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="customer-list">
        <h2>Customer List</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td>
                  <button onClick={() => handleShareBill(customer)}>Share Bill</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    );
  }

  return (
    <div>
  <MobileMenu activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => onLogout && onLogout('/vendor/login')} />
      {content}
    </div>
  );
}

export function VendorDashboardProtected(props) {
  return (
    <RequireAuth>
      <VendorDashboard {...props} />
    </RequireAuth>
  );
}
