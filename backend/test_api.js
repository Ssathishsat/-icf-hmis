const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('=== ICF HMIS API Test ===\n');

  // 1. Login
  const login = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login',
    method: 'POST', headers: { 'Content-Type': 'application/json' }
  }, { username: 'admin', password: 'Admin@123' });
  console.log('1. Login:', login.status === 200 ? 'OK' : 'FAIL', '- Status:', login.status);
  const token = login.data.token;
  if (!token) { console.log('No token! Aborting.'); return; }

  const auth = { Authorization: `Bearer ${token}` };

  // 2. KPI
  const kpi = await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard/kpi?from_date=2026-02-01&to_date=2026-05-19', headers: auth });
  console.log('2. KPI:', kpi.status === 200 ? 'OK' : 'FAIL', '- Data:', JSON.stringify(kpi.data.data));

  // 3. Employees (the fixed endpoint)
  const emp = await request({ hostname: 'localhost', port: 5000, path: '/api/employees?status=Sick&page=1&limit=5', headers: auth });
  console.log('3. Employees (Sick):', emp.status === 200 ? 'OK' : 'FAIL', '- Count:', emp.data?.data?.length, '- Total:', emp.data?.pagination?.total);

  // 4. Employees (Fit)
  const empFit = await request({ hostname: 'localhost', port: 5000, path: '/api/employees?status=Fit&page=1&limit=5', headers: auth });
  console.log('4. Employees (Fit):', empFit.status === 200 ? 'OK' : 'FAIL', '- Count:', empFit.data?.data?.length, '- Total:', empFit.data?.pagination?.total);

  // 5. Employees (all)
  const empAll = await request({ hostname: 'localhost', port: 5000, path: '/api/employees?page=1&limit=5', headers: auth });
  console.log('5. Employees (All):', empAll.status === 200 ? 'OK' : 'FAIL', '- Count:', empAll.data?.data?.length, '- Total:', empAll.data?.pagination?.total);

  // 6. Shop drilldown
  const drill = await request({ hostname: 'localhost', port: 5000, path: '/api/shops/CMC/drilldown?from_date=2026-02-01&to_date=2026-05-19', headers: auth });
  console.log('6. Shop Drilldown (CMC):', drill.status === 200 ? 'OK' : 'FAIL', '- SSE:', drill.data?.data?.shop?.sse_name, '- Employees:', drill.data?.data?.employees?.length);

  // 7. SSE Monitoring weekly
  const sse = await request({ hostname: 'localhost', port: 5000, path: '/api/sse-monitoring/weekly', headers: auth });
  console.log('7. SSE Weekly:', sse.status === 200 ? 'OK' : 'FAIL', '- New cases:', sse.data?.data?.summary?.new_count, '- Pending:', sse.data?.data?.summary?.pending_count);

  // 8. Weekly analytics
  const weekly = await request({ hostname: 'localhost', port: 5000, path: '/api/analytics/weekly?weeks=8', headers: auth });
  console.log('8. Weekly Analytics:', weekly.status === 200 ? 'OK' : 'FAIL', '- Weeks:', weekly.data?.data?.length);

  // 9. Monthly analytics
  const monthly = await request({ hostname: 'localhost', port: 5000, path: '/api/analytics/monthly?months=12', headers: auth });
  console.log('9. Monthly Analytics:', monthly.status === 200 ? 'OK' : 'FAIL', '- Months:', monthly.data?.data?.length);

  // 10. Heatmap
  const heatmap = await request({ hostname: 'localhost', port: 5000, path: '/api/analytics/heatmap?from_date=2026-02-01&to_date=2026-05-19', headers: auth });
  console.log('10. Heatmap:', heatmap.status === 200 ? 'OK' : 'FAIL', '- Items:', heatmap.data?.data?.length);

  // 11. SSE Performance
  const ssePerf = await request({ hostname: 'localhost', port: 5000, path: '/api/analytics/sse-performance', headers: auth });
  console.log('11. SSE Performance:', ssePerf.status === 200 ? 'OK' : 'FAIL', '- SSEs:', ssePerf.data?.data?.length);

  // 12. Predictions
  const pred = await request({ hostname: 'localhost', port: 5000, path: '/api/analytics/predictions', headers: auth });
  console.log('12. Predictions:', pred.status === 200 ? 'OK' : 'FAIL', '- Days:', pred.data?.data?.predictions?.length);

  console.log('\n=== All tests complete ===');
}

test().catch(console.error);
