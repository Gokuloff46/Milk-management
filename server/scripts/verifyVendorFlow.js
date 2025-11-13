const API = 'http://localhost:5000/api/vendors';

async function run() {
  try {
    console.log('1) Registering a new vendor...');
    const registerRes = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Vendor', email: `testvendor${Date.now()}@example.com`, password: 'testpass', address: '123 Test St', phone: '000111222' })
    });
    const regData = await registerRes.json();
    if (!registerRes.ok) throw new Error('Register failed: ' + JSON.stringify(regData));
    const vendor = regData.vendor || regData;
    console.log('Registered vendor id:', vendor._id);

    console.log('2) Fetching vendor to confirm status...');
    const fetchRes = await fetch(`${API}/${vendor._id}`);
    const fetched = await fetchRes.json();
    console.log('Vendor status:', fetched.status);
    if (fetched.status !== 'pending') throw new Error('Vendor should be pending after registration');

    console.log('3) Attempting to login (should be blocked)...');
    const loginRes = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: vendor.email, password: 'testpass' })
    });
    const loginData = await loginRes.json();
    console.log('Login response status:', loginRes.status, loginData.error || loginData);
    if (loginRes.status !== 403) throw new Error('Login should be forbidden for pending vendor');

  console.log('4) Attempting to approve vendor without Authorization header (should fail)...');
  const approveResNoAuth = await fetch(`${API}/${vendor._id}/approve`, { method: 'PUT' });
  const approveDataNoAuth = await approveResNoAuth.json();
  console.log('Approve w/o auth status:', approveResNoAuth.status, approveDataNoAuth);
  if (approveResNoAuth.status === 200) throw new Error('Approve should not succeed without Authorization');

  console.log('5) Logging in as admin to obtain token...');
  const loginAdmin = await fetch('http://localhost:5000/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'admin123' }) });
  const loginAdminData = await loginAdmin.json();
  if (!loginAdmin.ok) throw new Error('Admin login failed: ' + JSON.stringify(loginAdminData));
  const token = loginAdminData.token;

  console.log('6) Approving vendor with Bearer token (should succeed)...');
  const approveRes = await fetch(`${API}/${vendor._id}/approve`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
  const approveData = await approveRes.json();
  console.log('Approve response:', approveRes.status, approveData.message || approveData);
  if (!approveRes.ok) throw new Error('Approve failed: ' + JSON.stringify(approveData));

    console.log('5) Fetching vendor again to confirm approved...');
    const fetch2 = await fetch(`${API}/${vendor._id}`);
    const fetched2 = await fetch2.json();
    console.log('Vendor status after approve:', fetched2.status);
    if (fetched2.status !== 'approved') throw new Error('Vendor status should be approved after approve call');

    console.log('6) Attempting to login (should succeed)...');
    const loginRes2 = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: vendor.email, password: 'testpass' })
    });
    const loginData2 = await loginRes2.json();
    console.log('Final login status:', loginRes2.status, loginData2._id ? 'success' : loginData2);
    if (loginRes2.status !== 200) throw new Error('Login failed after approval');

    console.log('Vendor flow verification succeeded.');
  } catch (err) {
    console.error('Verification failed:', err.message);
    process.exit(2);
  }
}

run();
