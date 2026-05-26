// Mock data for demo mode (when MySQL is not available)

const shops = [
  { shop_code: 'CMC', shop_name: 'Carriage Machine Shop', department: 'Production', division: 'Mechanical', location: 'ICF Chennai', is_active: 1 },
  { shop_code: 'WRS', shop_name: 'Wheel & Roller Shop', department: 'Production', division: 'Mechanical', location: 'ICF Chennai', is_active: 1 },
  { shop_code: 'PRS', shop_name: 'Paint & Rust Prevention Shop', department: 'Production', division: 'Mechanical', location: 'ICF Chennai', is_active: 1 },
  { shop_code: 'FRS', shop_name: 'Furnishing Shop', department: 'Production', division: 'Mechanical', location: 'ICF Chennai', is_active: 1 },
  { shop_code: 'ELS', shop_name: 'Electrical Shop', department: 'Electrical', division: 'Electrical', location: 'ICF Chennai', is_active: 1 },
  { shop_code: 'TRS', shop_name: 'Trimming Shop', department: 'Production', division: 'Mechanical', location: 'ICF Chennai', is_active: 1 },
  { shop_code: 'BDS', shop_name: 'Body & Bogie Shop', department: 'Production', division: 'Mechanical', location: 'ICF Chennai', is_active: 1 },
  { shop_code: 'HRS', shop_name: 'Heat Treatment Shop', department: 'Production', division: 'Mechanical', location: 'ICF Chennai', is_active: 1 },
  { shop_code: 'QCS', shop_name: 'Quality Control Section', department: 'Quality', division: 'QA', location: 'ICF Chennai', is_active: 1 },
  { shop_code: 'ADM', shop_name: 'Administration', department: 'Admin', division: 'General', location: 'ICF Chennai', is_active: 1 },
];

const employees = [
  { EMISCARDNUMBER: 'ICF001001', emp_name: 'RAJESH KUMAR', designation: 'Senior Section Engineer', department: 'Production', shop_code: 'CMC', category: 'Supervisory', grade: 'JA', gender: 'Male', current_status: 'Sick', last_sick_date: '2026-05-10' },
  { EMISCARDNUMBER: 'ICF001002', emp_name: 'SURESH BABU', designation: 'Technician Gr-I', department: 'Production', shop_code: 'CMC', category: 'Non-Supervisory', grade: 'GP2800', gender: 'Male', current_status: 'Fit', last_sick_date: '2026-04-20' },
  { EMISCARDNUMBER: 'ICF001003', emp_name: 'PRIYA DEVI', designation: 'Junior Engineer', department: 'Production', shop_code: 'CMC', category: 'Supervisory', grade: 'JE', gender: 'Female', current_status: null, last_sick_date: null },
  { EMISCARDNUMBER: 'ICF002001', emp_name: 'VENKATESH P', designation: 'Senior Section Engineer', department: 'Production', shop_code: 'WRS', category: 'Supervisory', grade: 'JA', gender: 'Male', current_status: 'Sick', last_sick_date: '2026-05-12' },
  { EMISCARDNUMBER: 'ICF002002', emp_name: 'ANAND K', designation: 'Technician Gr-I', department: 'Production', shop_code: 'WRS', category: 'Non-Supervisory', grade: 'GP2800', gender: 'Male', current_status: 'Sick', last_sick_date: '2026-05-08' },
  { EMISCARDNUMBER: 'ICF003001', emp_name: 'KRISHNAMURTHY V', designation: 'Section Engineer', department: 'Production', shop_code: 'PRS', category: 'Supervisory', grade: 'SS', gender: 'Male', current_status: null, last_sick_date: '2026-03-15' },
  { EMISCARDNUMBER: 'ICF004001', emp_name: 'SUNDARAM K', designation: 'Senior Section Engineer', department: 'Production', shop_code: 'FRS', category: 'Supervisory', grade: 'JA', gender: 'Male', current_status: 'Sick', last_sick_date: '2026-05-14' },
  { EMISCARDNUMBER: 'ICF005001', emp_name: 'ARUMUGAM S', designation: 'Senior Section Engineer', department: 'Electrical', shop_code: 'ELS', category: 'Supervisory', grade: 'JA', gender: 'Male', current_status: null, last_sick_date: '2026-02-10' },
  { EMISCARDNUMBER: 'ICF005003', emp_name: 'SENTHIL K', designation: 'Technician Gr-I', department: 'Electrical', shop_code: 'ELS', category: 'Non-Supervisory', grade: 'GP2800', gender: 'Male', current_status: 'Sick', last_sick_date: '2026-05-01' },
  { EMISCARDNUMBER: 'ICF007001', emp_name: 'NATARAJAN P', designation: 'Senior Section Engineer', department: 'Production', shop_code: 'BDS', category: 'Supervisory', grade: 'JA', gender: 'Male', current_status: 'Fit', last_sick_date: '2026-04-28' },
];

// Generate day-wise trend for last 30 days
const generateDayTrend = () => {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      trend_date: d.toISOString().split('T')[0],
      sick_count: Math.floor(Math.random() * 5) + 1,
      fit_count: Math.floor(Math.random() * 3),
      total_count: Math.floor(Math.random() * 7) + 1,
    });
  }
  return data;
};

const generateWeeklyData = () => {
  const data = [];
  for (let i = 7; i >= 0; i--) {
    data.push({
      yr: 2026,
      wk: 20 - i,
      week_start: new Date(Date.now() - i * 7 * 86400000).toISOString().split('T')[0],
      sick_count: Math.floor(Math.random() * 12) + 3,
      fit_count: Math.floor(Math.random() * 8) + 1,
      total_count: Math.floor(Math.random() * 18) + 5,
    });
  }
  return data;
};

const generateMonthlyData = () => {
  const months = ['Jan 2026','Feb 2026','Mar 2026','Apr 2026','May 2026'];
  return months.map((m, i) => ({
    yr: 2026, mo: i + 1, month_label: m,
    sick_count: Math.floor(Math.random() * 30) + 10,
    fit_count: Math.floor(Math.random() * 20) + 5,
    total_count: Math.floor(Math.random() * 45) + 15,
  }));
};

const shopDistribution = shops.map(s => ({
  ...s,
  sick_count: Math.floor(Math.random() * 6) + 1,
  fit_count: Math.floor(Math.random() * 4),
  total_cases: Math.floor(Math.random() * 9) + 1,
}));

const sseContacts = [
  { contact_id: 1, sse_name: 'RAJESH KUMAR', shop_code: 'CMC', shop_name: 'Carriage Machine Shop', cug_number: '9444001001', designation: 'Senior Section Engineer', current_sick_count: 3 },
  { contact_id: 2, sse_name: 'VENKATESH P', shop_code: 'WRS', shop_name: 'Wheel & Roller Shop', cug_number: '9444002001', designation: 'Senior Section Engineer', current_sick_count: 2 },
  { contact_id: 3, sse_name: 'KRISHNAMURTHY V', shop_code: 'PRS', shop_name: 'Paint & Rust Prevention Shop', cug_number: '9444003001', designation: 'Section Engineer', current_sick_count: 0 },
  { contact_id: 4, sse_name: 'SUNDARAM K', shop_code: 'FRS', shop_name: 'Furnishing Shop', cug_number: '9444004001', designation: 'Senior Section Engineer', current_sick_count: 1 },
  { contact_id: 5, sse_name: 'ARUMUGAM S', shop_code: 'ELS', shop_name: 'Electrical Shop', cug_number: '9444005001', designation: 'Senior Section Engineer', current_sick_count: 2 },
  { contact_id: 6, sse_name: 'PALANISWAMY G', shop_code: 'TRS', shop_name: 'Trimming Shop', cug_number: '9444006001', designation: 'Section Engineer', current_sick_count: 0 },
  { contact_id: 7, sse_name: 'NATARAJAN P', shop_code: 'BDS', shop_name: 'Body & Bogie Shop', cug_number: '9444007001', designation: 'Senior Section Engineer', current_sick_count: 1 },
];

const ssePerformance = sseContacts.map(c => ({
  ...c,
  total_cases: Math.floor(Math.random() * 15) + 3,
  recovered: Math.floor(Math.random() * 8) + 1,
  current_sick: c.current_sick_count,
  avg_recovery_days: (Math.random() * 10 + 3).toFixed(1),
}));

const notifications = [
  { notif_id: 1, title: 'High Sick Count – CMC', message: '3 employees on sick leave in CMC this week', type: 'alert', shop_code: 'CMC', is_read: 0, created_at: new Date().toISOString() },
  { notif_id: 2, title: 'New Cases Today', message: '2 new sick cases reported today across ICF', type: 'warning', shop_code: null, is_read: 0, created_at: new Date().toISOString() },
  { notif_id: 3, title: 'Weekly Report Ready', message: 'Weekly sick/fit monitoring report is ready', type: 'info', shop_code: null, is_read: 1, created_at: new Date().toISOString() },
  { notif_id: 4, title: 'Recovery Update', message: '2 employees from WRS shop declared fit', type: 'success', shop_code: 'WRS', is_read: 1, created_at: new Date().toISOString() },
];

const heatmapData = [];
shops.slice(0, 6).forEach(s => {
  for (let w = 18; w <= 21; w++) {
    heatmapData.push({ shop_code: s.shop_code, shop_name: s.shop_name, week_num: w, case_count: Math.floor(Math.random() * 7), risk_level: ['low','medium','high'][Math.floor(Math.random()*3)] });
  }
});

const deptTrends = [
  { department: 'Production', sick_count: 18, fit_count: 8, total_count: 26 },
  { department: 'Electrical', sick_count: 7, fit_count: 3, total_count: 10 },
  { department: 'Quality', sick_count: 3, fit_count: 2, total_count: 5 },
  { department: 'Admin', sick_count: 2, fit_count: 1, total_count: 3 },
];

module.exports = {
  shops, employees, shopDistribution, sseContacts, ssePerformance,
  notifications, heatmapData, deptTrends,
  generateDayTrend, generateWeeklyData, generateMonthlyData,
};
