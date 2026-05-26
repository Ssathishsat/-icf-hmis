const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const mock = require('../config/mockData');

let pool;
try { pool = require('../config/db'); } catch(e) { pool = null; }
const isDbAvailable = async () => {
  if (!pool) return false;
  try { await pool.execute('SELECT 1 FROM users LIMIT 1'); return true; } catch(e) { return false; }
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { sf_code } = req.query;
    if (await isDbAvailable()) {
      if (sf_code) {
        // Query distinct shops that have employees in the requested SF division
        const [rows] = await pool.execute(`
          SELECT DISTINCT s.* 
          FROM shops s
          JOIN employees e ON s.shop_code = e.shop_code
          WHERE e.sf_code = ? AND s.is_active = 1
          ORDER BY CAST(s.shop_code AS UNSIGNED), s.shop_code
        `, [sf_code]);
        return res.json({ success: true, data: rows });
      } else {
        const [rows] = await pool.execute('SELECT * FROM shops WHERE is_active=1 ORDER BY CAST(shop_code AS UNSIGNED), shop_code');
        return res.json({ success: true, data: rows });
      }
    }
    res.json({ success: true, data: mock.shops });
  } catch(err) { res.json({ success: true, data: mock.shops }); }
});

router.get('/:shop_code/drilldown', authenticateToken, async (req, res) => {
  try {
    const { shop_code } = req.params;
    const { from_date, to_date } = req.query;
    const fromDate = from_date || new Date(Date.now()-90*24*60*60*1000).toISOString().split('T')[0];
    const toDate = to_date || new Date().toISOString().split('T')[0];

    if (await isDbAvailable()) {
      const [shopRows] = await pool.execute(`
        SELECT s.shop_code, s.shop_name, s.department, s.division,
          c.sse_name, c.cug_number, c.designation AS sse_designation, c.EMISCARDNUMBER AS sse_emis
        FROM shops s LEFT JOIN cug_contacts c ON s.shop_code=c.shop_code AND c.is_active=1
        WHERE s.shop_code=? LIMIT 1
      `, [shop_code]);
      if (shopRows.length === 0) return res.status(404).json({ success: false, message: 'Shop not found' });
      const [summaryRows] = await pool.execute(`
        SELECT COUNT(CASE WHEN r.status='Sick' AND r.fit_date IS NULL THEN 1 END) AS current_sick,
          COUNT(CASE WHEN r.status='Fit' THEN 1 END) AS total_fit,
          COUNT(DISTINCT r.EMISCARDNUMBER) AS total_affected, AVG(r.days_count) AS avg_days
        FROM sick_fit_records r JOIN employees e ON r.EMISCARDNUMBER=e.EMISCARDNUMBER
        WHERE e.shop_code=? AND r.sick_date BETWEEN ? AND ?
      `, [shop_code, fromDate, toDate]);
      const [empRows] = await pool.execute(`
        SELECT e.EMISCARDNUMBER, e.emp_name, e.designation, e.department, e.category,
          r.status, r.sick_date, r.fit_date, r.days_count, r.reporting_doctor, r.diagnosis, r.hospital_name
        FROM employees e JOIN sick_fit_records r ON e.EMISCARDNUMBER=r.EMISCARDNUMBER
        WHERE e.shop_code=? AND r.sick_date BETWEEN ? AND ?
        ORDER BY r.sick_date DESC
      `, [shop_code, fromDate, toDate]);
      const [trendRows] = await pool.execute(`
        SELECT DATE(r.sick_date) AS trend_date,
          SUM(CASE WHEN r.status='Sick' THEN 1 ELSE 0 END) AS sick_count,
          SUM(CASE WHEN r.status='Fit' THEN 1 ELSE 0 END) AS fit_count
        FROM sick_fit_records r JOIN employees e ON r.EMISCARDNUMBER=e.EMISCARDNUMBER
        WHERE e.shop_code=? AND r.sick_date BETWEEN ? AND ?
        GROUP BY DATE(r.sick_date) ORDER BY trend_date
      `, [shop_code, fromDate, toDate]);
      return res.json({ success: true, data: { shop: shopRows[0], summary: summaryRows[0], employees: empRows, trend: trendRows } });
    }

    // Mock drilldown
    const shop = mock.shops.find(s => s.shop_code === shop_code) || mock.shops[0];
    const sse = mock.sseContacts.find(c => c.shop_code === shop_code) || mock.sseContacts[0];
    const emps = mock.employees.filter(e => e.shop_code === shop_code);
    const trend = mock.generateDayTrend().slice(-14);
    res.json({ success: true, data: {
      shop: { ...shop, sse_name: sse.sse_name, cug_number: sse.cug_number, sse_designation: sse.designation },
      summary: { current_sick: sse.current_sick_count, total_fit: 3, total_affected: emps.length, avg_days: 6.5 },
      employees: emps.map(e => ({ ...e, status: e.current_status || 'Sick', sick_date: '2026-05-10', fit_date: null, days_count: 8, reporting_doctor: 'Dr. Ramachandran', diagnosis: 'Fever', hospital_name: 'ICF Hospital' })),
      trend
    }});
  } catch(err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
