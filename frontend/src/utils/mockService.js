// Frontend mock service — used when backend is unreachable (e.g. Netlify static deploy)

const DEMO_USERS = [
  { user_id: 1, username: 'admin',   full_name: 'System Administrator',           email: 'admin@icf.railnet.gov.in',   role: 'Admin', shop_code: null },
  { user_id: 2, username: 'pcmo',    full_name: 'Principal Chief Medical Officer', email: 'pcmo@icf.railnet.gov.in',    role: 'Admin', shop_code: null },
  { user_id: 3, username: 'sse_cmc', full_name: 'RAJESH KUMAR',                   email: 'sse.cmc@icf.railnet.gov.in', role: 'SSE',   shop_code: 'CMC' },
  { user_id: 4, username: 'sse_wrs', full_name: 'VENKATESH P',                    email: 'sse.wrs@icf.railnet.gov.in', role: 'SSE',   shop_code: 'WRS' },
  { user_id: 5, username: 'sse_els', full_name: 'ARUMUGAM S',                     email: 'sse.els@icf.railnet.gov.in', role: 'SSE',   shop_code: 'ELS' },
];

const shops = [
  { shop_code: 'CMC', shop_name: 'Carriage Machine Shop',         department: 'Production', sick_count: 5, fit_count: 3, total_cases: 8 },
  { shop_code: 'WRS', shop_name: 'Wheel & Roller Shop',           department: 'Production', sick_count: 4, fit_count: 2, total_cases: 6 },
  { shop_code: 'PRS', shop_name: 'Paint & Rust Prevention Shop',  department: 'Production', sick_count: 2, fit_count: 1, total_cases: 3 },
  { shop_code: 'FRS', shop_name: 'Furnishing Shop',               department: 'Production', sick_count: 3, fit_count: 2, total_cases: 5 },
  { shop_code: 'ELS', shop_name: 'Electrical Shop',               department: 'Electrical', sick_count: 3, fit_count: 1, total_cases: 4 },
  { shop_code: 'TRS', shop_name: 'Trimming Shop',                 department: 'Production', sick_count: 1, fit_count: 1, total_cases: 2 },
  { shop_code: 'BDS', shop_name: 'Body & Bogie Shop',             department: 'Production', sick_count: 2, fit_count: 2, total_cases: 4 },
  { shop_code: 'HRS', shop_name: 'Heat Treatment Shop',           department: 'Production', sick_count: 1, fit_count: 0, total_cases: 1 },
  { shop_code: 'QCS', shop_name: 'Quality Control Section',       department: 'Quality',    sick_count: 1, fit_count: 1, total_cases: 2 },
  { shop_code: 'ADM', shop_name: 'Administration',                department: 'Admin',      sick_count: 1, fit_count: 0, total_cases: 1 },
];

const generateDayTrend = () => {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      trend_date: d.toISOString().split('T')[0],
      sick_count: Math.floor(Math.random() * 5) + 1,
      fit_count:  Math.floor(Math.random() * 3),
      total_count: Math.floor(Math.random() * 7) + 1,
    });
  }
  return data;
};

const generateWeekly = () => {
  return Array.from({ length: 8 }, (_, i) => ({
    yr: 2026, wk: 18 + i,
    week_start: new Date(Date.now() - (7 - i) * 7 * 86400000).toISOString().split('T')[0],
    sick_count: Math.floor(Math.random() * 12) + 3,
    fit_count:  Math.floor(Math.random() * 8) + 1,
    total_count: Math.floor(Math.random() * 18) + 5,
  }));
};

const generateMonthly = () =>
  ['Jan 2026','Feb 2026','Mar 2026','Apr 2026','May 2026'].map((m, i) => ({
    yr: 2026, mo: i + 1, month_label: m,
    sick_count: Math.floor(Math.random() * 30) + 10,
    fit_count:  Math.floor(Math.random() * 20) + 5,
    total_count: Math.floor(Math.random() * 45) + 15,
  }));

const sseContacts = [
  { contact_id: 1, sse_name: 'RAJESH KUMAR',    shop_code: 'CMC', shop_name: 'Carriage Machine Shop',        cug_number: '9444001001', designation: 'Senior Section Engineer', current_sick_count: 3 },
  { contact_id: 2, sse_name: 'VENKATESH P',      shop_code: 'WRS', shop_name: 'Wheel & Roller Shop',          cug_number: '9444002001', designation: 'Senior Section Engineer', current_sick_count: 2 },
  { contact_id: 3, sse_name: 'KRISHNAMURTHY V',  shop_code: 'PRS', shop_name: 'Paint & Rust Prevention Shop', cug_number: '9444003001', designation: 'Section Engineer',        current_sick_count: 0 },
  { contact_id: 4, sse_name: 'SUNDARAM K',       shop_code: 'FRS', shop_name: 'Furnishing Shop',              cug_number: '9444004001', designation: 'Senior Section Engineer', current_sick_count: 1 },
  { contact_id: 5, sse_name: 'ARUMUGAM S',       shop_code: 'ELS', shop_name: 'Electrical Shop',              cug_number: '9444005001', designation: 'Senior Section Engineer', current_sick_count: 2 },
  { contact_id: 6, sse_name: 'PALANISWAMY G',    shop_code: 'TRS', shop_name: 'Trimming Shop',                cug_number: '9444006001', designation: 'Section Engineer',        current_sick_count: 0 },
  { contact_id: 7, sse_name: 'NATARAJAN P',      shop_code: 'BDS', shop_name: 'Body & Bogie Shop',            cug_number: '9444007001', designation: 'Senior Section Engineer', current_sick_count: 1 },
];

const ssePerformance = sseContacts.map(c => ({
  ...c,
  total_cases: Math.floor(Math.random() * 15) + 3,
  recovered: Math.floor(Math.random() * 8) + 1,
  current_sick: c.current_sick_count,
  avg_recovery_days: (Math.random() * 10 + 3).toFixed(1),
}));

const mockEmployeesByShop = {
  CMC: [
    { EMISCARDNUMBER: 'ICF001001', emp_name: 'RAJESH KUMAR',   designation: 'Senior Section Engineer', category: 'Supervisory',     status: 'Sick', sick_date: '2026-05-10', fit_date: null,         days_count: 15, diagnosis: 'Fever',          hospital_name: 'ICF Hospital' },
    { EMISCARDNUMBER: 'ICF001002', emp_name: 'SURESH BABU',    designation: 'Technician Gr-I',         category: 'Non-Supervisory', status: 'Fit',  sick_date: '2026-04-20', fit_date: '2026-04-27', days_count: 7,  diagnosis: 'Viral Infection', hospital_name: 'ICF Hospital' },
    { EMISCARDNUMBER: 'ICF001003', emp_name: 'PRIYA DEVI',     designation: 'Junior Engineer',         category: 'Supervisory',     status: 'Fit',  sick_date: '2026-03-15', fit_date: '2026-03-22', days_count: 7,  diagnosis: 'Cold',           hospital_name: 'ICF Hospital' },
  ],
  WRS: [
    { EMISCARDNUMBER: 'ICF002001', emp_name: 'VENKATESH P',    designation: 'Senior Section Engineer', category: 'Supervisory',     status: 'Sick', sick_date: '2026-05-12', fit_date: null,         days_count: 13, diagnosis: 'Back Pain',      hospital_name: 'ICF Hospital' },
    { EMISCARDNUMBER: 'ICF002002', emp_name: 'ANAND K',        designation: 'Technician Gr-I',         category: 'Non-Supervisory', status: 'Sick', sick_date: '2026-05-08', fit_date: null,         days_count: 17, diagnosis: 'Fever',          hospital_name: 'ICF Hospital' },
  ],
  ELS: [
    { EMISCARDNUMBER: 'ICF005001', emp_name: 'ARUMUGAM S',     designation: 'Senior Section Engineer', category: 'Supervisory',     status: 'Fit',  sick_date: '2026-02-10', fit_date: '2026-02-17', days_count: 7,  diagnosis: 'Flu',            hospital_name: 'ICF Hospital' },
    { EMISCARDNUMBER: 'ICF005003', emp_name: 'SENTHIL K',      designation: 'Technician Gr-I',         category: 'Non-Supervisory', status: 'Sick', sick_date: '2026-05-01', fit_date: null,         days_count: 24, diagnosis: 'Typhoid',        hospital_name: 'ICF Hospital' },
  ],
};

const notifications = [
  { notif_id: 1, title: 'High Sick Count – CMC', message: '3 employees on sick leave in CMC this week',    type: 'alert',   shop_code: 'CMC', is_read: 0, created_at: new Date().toISOString() },
  { notif_id: 2, title: 'New Cases Today',        message: '2 new sick cases reported today across ICF',   type: 'warning', shop_code: null,  is_read: 0, created_at: new Date().toISOString() },
  { notif_id: 3, title: 'Weekly Report Ready',    message: 'Weekly sick/fit monitoring report is ready',   type: 'info',    shop_code: null,  is_read: 1, created_at: new Date().toISOString() },
  { notif_id: 4, title: 'Recovery Update',        message: '2 employees from WRS shop declared fit',       type: 'success', shop_code: 'WRS', is_read: 1, created_at: new Date().toISOString() },
];

const heatmapData = [];
shops.slice(0, 6).forEach(s => {
  for (let w = 18; w <= 21; w++) {
    heatmapData.push({ shop_code: s.shop_code, shop_name: s.shop_name, week_num: w, case_count: Math.floor(Math.random() * 7), risk_level: ['low','medium','high'][Math.floor(Math.random()*3)] });
  }
});

const deptTrends = [
  { department: 'Production', sick_count: 18, fit_count: 8,  total_count: 26 },
  { department: 'Electrical', sick_count: 7,  fit_count: 3,  total_count: 10 },
  { department: 'Quality',    sick_count: 3,  fit_count: 2,  total_count: 5  },
  { department: 'Admin',      sick_count: 2,  fit_count: 1,  total_count: 3  },
];

const categoryDistribution = [
  { category: 'Supervisory',     sick_count: 12, fit_count: 5, total_count: 17 },
  { category: 'Non-Supervisory', sick_count: 23, fit_count: 9, total_count: 32 },
];

const recentSick = [
  { emp_name: 'SUNDARAM K',    empno: 'ICF004001', department: 'Production', last_sick_date: '2026-05-14' },
  { emp_name: 'VENKATESH P',   empno: 'ICF002001', department: 'Production', last_sick_date: '2026-05-12' },
  { emp_name: 'RAJESH KUMAR',  empno: 'ICF001001', department: 'Production', last_sick_date: '2026-05-10' },
  { emp_name: 'ANAND K',       empno: 'ICF002002', department: 'Production', last_sick_date: '2026-05-08' },
  { emp_name: 'SENTHIL K',     empno: 'ICF005003', department: 'Electrical', last_sick_date: '2026-05-01' },
];

// Simple JWT-like token (base64 encoded, not verified on frontend)
const makeToken = (user) => {
  const payload = btoa(JSON.stringify({ ...user, exp: Date.now() + 8 * 3600 * 1000 }));
  return `mock.${payload}.sig`;
};

// ── Mock route handler ────────────────────────────────────────────────────────
export const mockRequest = (method, url, data) => {
  const path = url.replace(/\?.*$/, '');
  const query = Object.fromEntries(new URLSearchParams(url.includes('?') ? url.split('?')[1] : ''));

  // Auth
  if (method === 'POST' && path === '/auth/login') {
    const { username, password } = data || {};
    const user = DEMO_USERS.find(u => u.username === username);
    if (!user || password !== 'Admin@123') {
      return Promise.reject({ response: { status: 401, data: { success: false, message: 'Invalid credentials. Use Admin@123' } } });
    }
    return Promise.resolve({ data: { success: true, token: makeToken(user), user } });
  }

  if (method === 'GET' && path === '/auth/me') {
    return Promise.resolve({ data: { success: true } });
  }

  // Dashboard KPI
  if (path === '/dashboard/kpi') {
    return Promise.resolve({ data: { success: true, data: {
      total_sick_cases: 36, total_supervisory: 12, total_non_supervisory: 24,
      shops_affected: 8, current_week_cases: 7, monthly_cases: 18, active_sse_count: 7,
    }}});
  }

  if (path === '/dashboard/daywise-trend')         return Promise.resolve({ data: { success: true, data: generateDayTrend() } });
  if (path === '/dashboard/shop-distribution')     return Promise.resolve({ data: { success: true, data: shops } });
  if (path === '/dashboard/category-distribution') return Promise.resolve({ data: { success: true, data: categoryDistribution } });
  if (path === '/dashboard/division-stats')        return Promise.resolve({ data: { success: true, data: { Fur: { Total: 14, Male: 11, Female: 3 }, Shell: { Total: 22, Male: 19, Female: 3 } } } });
  if (path === '/dashboard/recent-sick')           return Promise.resolve({ data: { success: true, data: recentSick } });

  // Analytics
  if (path === '/analytics/weekly')               return Promise.resolve({ data: { success: true, data: generateWeekly() } });
  if (path === '/analytics/monthly')              return Promise.resolve({ data: { success: true, data: generateMonthly() } });
  if (path === '/analytics/department-trends')    return Promise.resolve({ data: { success: true, data: deptTrends } });
  if (path === '/analytics/sse-performance')      return Promise.resolve({ data: { success: true, data: ssePerformance } });
  if (path === '/analytics/heatmap')              return Promise.resolve({ data: { success: true, data: heatmapData } });
  if (path === '/analytics/predictions')          return Promise.resolve({ data: { success: true, data: { next_week: 9, next_month: 38, trend: 'stable', confidence: 78 } } });

  // SSE Monitoring
  if (path === '/sse-monitoring/contacts')        return Promise.resolve({ data: { success: true, data: sseContacts } });
  if (path === '/sse-monitoring/employees') {
    const shopCode = query.shop_code;
    const emps = mockEmployeesByShop[shopCode] || [];
    return Promise.resolve({ data: { success: true, data: emps } });
  }

  // Shops
  if (path === '/shops')                          return Promise.resolve({ data: { success: true, data: shops } });

  // Employees
  if (path === '/employees')                      return Promise.resolve({ data: { success: true, data: [], total: 0 } });

  // Notifications
  if (path === '/notifications')                  return Promise.resolve({ data: { success: true, data: notifications } });

  // Reports / Export
  if (path.startsWith('/reports'))               return Promise.resolve({ data: { success: true, data: [] } });

  // Fallback
  return Promise.resolve({ data: { success: true, data: [] } });
};
