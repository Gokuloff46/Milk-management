// Fetch all products
export const fetchProducts = async () => {
  const res = await fetch(`${API_BASE}/products`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.products || [];
};
// Fetch customer payments with optional date and method filter
export const fetchCustomerPayments = async ({ vendorId, date, method }) => {
  let url = `${API_BASE}/vendors/${vendorId}/customer-payments`;
  const params = [];
  if (date) params.push(`date=${encodeURIComponent(date)}`);
  if (method) params.push(`method=${encodeURIComponent(method)}`);
  if (params.length) url += `?${params.join('&')}`;
  return (await fetch(url)).json();
};

// Ensure the API base dynamically resolves correctly for production
export const getApiBase = () => {
  try {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    // Use localhost for local development
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5000/api';
    // Use production API for production domain
    if (host && host.endsWith('milk.kgr.life')) return `https://apimilk.kgr.life/api`;
  } catch (e) {
    console.error('Error resolving API base:', e);
  }
  // Default to localhost for development
  return 'http://localhost:5000/api';
};

const API_BASE = getApiBase();

// Fetch all customers
export const fetchCustomers = async () => {
  const res = await fetch(`${API_BASE}/customers`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.customers || [];
};

export const fetchMilk = async (vendorId) => {
  const url = vendorId ? `${API_BASE}/vendors/${vendorId}/milk` : `${API_BASE}/milk`;
  const res = await fetch(url);
  const data = await res.json();
  // vendor route returns an array; generic route returns { milk, total }
  return Array.isArray(data) ? data : (Array.isArray(data.milk) ? data.milk : []);
};
export const addMilk = async (data) => (await fetch(`${API_BASE}/milk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
export const updateMilk = async (id, data) => (await fetch(`${API_BASE}/milk/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
export const deleteMilk = async (id) => (await fetch(`${API_BASE}/milk/${id}`, { method: 'DELETE' })).json();

export const fetchSuppliers = async () => (await fetch(`${API_BASE}/suppliers`)).json();
export const addSupplier = async (data) => (await fetch(`${API_BASE}/suppliers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
export const updateSupplier = async (id, data) => (await fetch(`${API_BASE}/suppliers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
export const deleteSupplier = async (id) => (await fetch(`${API_BASE}/suppliers/${id}`, { method: 'DELETE' })).json();

export const fetchSales = async () => {
  const res = await fetch(`${API_BASE}/sales`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.sales || [];
};
export const addSale = async (data) => (await fetch(`${API_BASE}/sales`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
export const updateSale = async (id, data) => (await fetch(`${API_BASE}/sales/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).json();
export const deleteSale = async (id) => (await fetch(`${API_BASE}/sales/${id}`, { method: 'DELETE' })).json();
