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

router.get('/weekly', authenticateToken, async (req, res) => {
  try {
    if (await isDbAvailable()) {
      const { shop_code } = req.query;
      const shopFilter = shop_code ? ' AND e.shop_code=?' : '';
      const p = []; if (shop_code) p.push(shop_code);

      // New cases: sick_fit_records + ipd_records in last 7 days (deduplicated)
      const [sickNew] = await pool.execute(`
        SELECT r.EMISCARDNUMBER, r.sick_date, r.diagnosis, r.status,
               e.emp_name, e.designation, e.shop_code, e.category, s.shop_name,
               NULL AS dept_ward, 0 AS _isIpd
        FROM sick_fit_records r
        JOIN employees e ON r.EMISCARDNUMBER = e.EMISCARDNUMBER
        LEFT JOIN shops s ON e.shop_code = s.shop_code
        WHERE r.sick_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${shopFilter}
      `, p);

      const [ipdNew] = await pool.execute(`
        SELECT i.EMISCARDNUMBER, i.admission_date AS sick_date,
               CONCAT('Hospitalised – ', COALESCE(i.dept_ward,'')) AS diagnosis,
               'Hospitalised' AS status,
               e.emp_name, e.designation, e.shop_code, e.category, s.shop_name,
               i.dept_ward, 1 AS _isIpd
        FROM ipd_records i
        JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
        LEFT JOIN shops s ON e.shop_code = s.shop_code
        WHERE i.admission_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          AND i.admission_date <= CURDATE() ${shopFilter}
      `, p);

      // Deduplicate: sick_fit first, then IPD-only
      const sickEmis = new Set(sickNew.map(r => r.EMISCARDNUMBER));
      const ipdOnly  = ipdNew.filter(r => !sickEmis.has(r.EMISCARDNUMBER));
      const newCases = [...sickNew, ...ipdOnly].sort((a, b) =>
        new Date(b.sick_date) - new Date(a.sick_date)
      );

      const [recovered] = await pool.execute(`
        SELECT r.*, e.emp_name, e.designation, e.shop_code, s.shop_name
        FROM sick_fit_records r JOIN employees e ON r.EMISCARDNUMBER=e.EMISCARDNUMBER
        LEFT JOIN shops s ON e.shop_code=s.shop_code
        WHERE r.fit_date IS NOT NULL AND r.fit_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${shopFilter}
        ORDER BY r.fit_date DESC
      `, p);
      const [pending] = await pool.execute(`
        SELECT r.*, e.emp_name, e.designation, e.shop_code, s.shop_name, DATEDIFF(CURDATE(),r.sick_date) AS days_pending
        FROM sick_fit_records r JOIN employees e ON r.EMISCARDNUMBER=e.EMISCARDNUMBER
        LEFT JOIN shops s ON e.shop_code=s.shop_code
        WHERE r.fit_date IS NULL AND r.status='Sick' AND DATEDIFF(CURDATE(),r.sick_date)>7 ${shopFilter}
        ORDER BY days_pending DESC
      `, p);
      const [recurring] = await pool.execute(`
        SELECT r.EMISCARDNUMBER, e.emp_name, e.designation, e.shop_code, s.shop_name,
          COUNT(*) AS sick_count, MAX(r.sick_date) AS last_sick_date
        FROM sick_fit_records r JOIN employees e ON r.EMISCARDNUMBER=e.EMISCARDNUMBER
        LEFT JOIN shops s ON e.shop_code=s.shop_code
        WHERE r.sick_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) ${shopFilter}
        GROUP BY r.EMISCARDNUMBER, e.emp_name, e.designation, e.shop_code, s.shop_name
        HAVING sick_count >= 2 ORDER BY sick_count DESC
      `, p);
      return res.json({ success: true, data: { new_cases: newCases, recovered, pending_followup: pending, recurring_cases: recurring, summary: { new_count: newCases.length, recovered_count: recovered.length, pending_count: pending.length, recurring_count: recurring.length } } });
    }
    // Mock
    const newCases = mock.employees.slice(0, 3).map(e => ({ ...e, status: 'Sick', sick_date: new Date().toISOString().split('T')[0], fit_date: null, days_count: 2, diagnosis: 'Fever', reporting_doctor: 'Dr. Ramachandran' }));
    const recovered = mock.employees.slice(3, 5).map(e => ({ ...e, status: 'Fit', sick_date: '2026-05-10', fit_date: new Date().toISOString().split('T')[0], days_count: 7 }));
    const pending = mock.employees.slice(5, 7).map(e => ({ ...e, status: 'Sick', sick_date: '2026-05-01', fit_date: null, days_pending: 17 }));
    const recurring = mock.employees.slice(0, 2).map(e => ({ ...e, sick_count: 3, last_sick_date: '2026-05-10' }));
    res.json({ success: true, data: { new_cases: newCases, recovered, pending_followup: pending, recurring_cases: recurring, summary: { new_count: newCases.length, recovered_count: recovered.length, pending_count: pending.length, recurring_count: recurring.length } } });
  } catch(err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const { shop_code } = req.query;
    if (await isDbAvailable()) {
      let shopFilter = shop_code ? 'WHERE c.shop_code=?' : '';
      const p = shop_code ? [shop_code] : [];
      // Return one contact per employee (distinct EMISCARDNUMBER), limit 200
      const [rows] = await pool.execute(`
        SELECT
          c.contact_id, c.sse_name, c.EMISCARDNUMBER,
          c.cug_number, c.designation, c.shop_code,
          c.department, s.shop_name,
          (SELECT COUNT(*) FROM sick_fit_records r
           WHERE r.EMISCARDNUMBER=c.EMISCARDNUMBER
             AND r.fit_date IS NULL AND r.status='Sick') AS current_sick_count
        FROM (
          SELECT MIN(contact_id) AS contact_id, EMISCARDNUMBER,
                 MIN(sse_name) AS sse_name, MIN(cug_number) AS cug_number,
                 MIN(designation) AS designation, MIN(shop_code) AS shop_code,
                 MIN(department) AS department
          FROM cug_contacts
          WHERE is_active=1
          GROUP BY EMISCARDNUMBER
          LIMIT 200
        ) c
        LEFT JOIN shops s ON c.shop_code = s.shop_code
        ${shopFilter}
        ORDER BY c.sse_name
      `, p);
      return res.json({ success: true, data: rows });
    }
    let data = mock.sseContacts;
    if (shop_code) data = data.filter(c => c.shop_code === shop_code);
    res.json({ success: true, data });
  } catch(err) {
    console.error('SSE contacts error:', err.message);
    res.json({ success: true, data: [] });
  }
});

// GET /api/sse-monitoring/shops — shop-wise summary with supervisors + sick counts
router.get('/shops', authenticateToken, async (req, res) => {
  try {
    if (await isDbAvailable()) {
      // Pre-aggregate sick counts from both sources
      const [sickCounts] = await pool.execute(`
        SELECT shop_code, COUNT(DISTINCT EMISCARDNUMBER) AS sick_now
        FROM (
          SELECT e.shop_code, r.EMISCARDNUMBER
          FROM sick_fit_records r JOIN employees e ON r.EMISCARDNUMBER = e.EMISCARDNUMBER
          UNION
          SELECT e.shop_code, i.EMISCARDNUMBER
          FROM ipd_records i JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
        ) combined
        GROUP BY shop_code
      `);
      const sickMap = {};
      for (const r of sickCounts) sickMap[r.shop_code] = parseInt(r.sick_now);

      // Pre-aggregate supervisor counts (Supervisory category in CUG only)
      const [supvCounts] = await pool.execute(`
        SELECT c.shop_code, COUNT(DISTINCT c.EMISCARDNUMBER) AS supv_count
        FROM cug_contacts c
        JOIN employees e ON c.EMISCARDNUMBER = e.EMISCARDNUMBER
        WHERE c.is_active = 1 AND e.category = 'Supervisory'
        GROUP BY c.shop_code
      `);
      const supvMap = {};
      for (const r of supvCounts) supvMap[r.shop_code] = parseInt(r.supv_count);

      // Main shops query — simple, fast
      const [shops] = await pool.execute(`
        SELECT
          s.shop_code,
          s.shop_name,
          s.department,
          COUNT(DISTINCT e.EMISCARDNUMBER) AS total_employees
        FROM shops s
        LEFT JOIN employees e ON e.shop_code = s.shop_code
        WHERE s.is_active = 1
        GROUP BY s.shop_code, s.shop_name, s.department
      `);

      // Merge counts into shops
      const shopsWithCounts = shops.map(sh => ({
        ...sh,
        sick_now:    sickMap[sh.shop_code]  || 0,
        supervisors: supvMap[sh.shop_code]  || 0,
      })).sort((a, b) => b.sick_now - a.sick_now || parseInt(a.shop_code) - parseInt(b.shop_code));

      // Only Supervisory category employees from CUG contacts
      const [supervisors] = await pool.execute(`
        SELECT
          c.shop_code,
          c.sse_name,
          c.designation,
          c.cug_number,
          c.EMISCARDNUMBER
        FROM (
          SELECT MIN(contact_id) AS contact_id, EMISCARDNUMBER,
                 MIN(sse_name) AS sse_name, MIN(cug_number) AS cug_number,
                 MIN(designation) AS designation, MIN(shop_code) AS shop_code
          FROM cug_contacts
          WHERE is_active = 1
          GROUP BY EMISCARDNUMBER
        ) c
        JOIN employees e ON c.EMISCARDNUMBER = e.EMISCARDNUMBER
        WHERE e.category = 'Supervisory'
        ORDER BY c.shop_code, c.sse_name
      `);

      // Group supervisors by shop
      const supvByShop = {};
      for (const s of supervisors) {
        if (!supvByShop[s.shop_code]) supvByShop[s.shop_code] = [];
        supvByShop[s.shop_code].push(s);
      }

      const result = shopsWithCounts.map(sh => ({
        ...sh,
        supervisors: supvByShop[sh.shop_code] || [],
      }));

      return res.json({ success: true, data: result });
    }
    res.json({ success: true, data: [] });
  } catch(err) {
    console.error('SSE shops error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/sse-monitoring/employees
router.get('/employees', authenticateToken, async (req, res) => {
  try {
    const { shop_code } = req.query;
    if (!shop_code) {
      return res.status(400).json({ success: false, message: 'shop_code is required' });
    }

    if (await isDbAvailable()) {
      // All sick_fit_records employees for this shop (everyone is sick, no fit concept)
      const [sickRows] = await pool.execute(`
        SELECT DISTINCT
          e.EMISCARDNUMBER,
          e.emp_name,
          e.designation,
          e.category,
          r.sick_date,
          r.days_count,
          r.diagnosis,
          r.reporting_doctor,
          r.hospital_name,
          'Sick' AS source
        FROM employees e
        JOIN sick_fit_records r ON r.record_id = (
          SELECT record_id FROM sick_fit_records
          WHERE EMISCARDNUMBER = e.EMISCARDNUMBER
          ORDER BY sick_date DESC, record_id DESC LIMIT 1
        )
        WHERE e.shop_code = ?
        ORDER BY r.sick_date DESC
      `, [shop_code]);

      // All IPD records for this shop
      const [ipdRows] = await pool.execute(`
        SELECT DISTINCT
          e.EMISCARDNUMBER,
          e.emp_name,
          e.designation,
          e.category,
          i.admission_date  AS sick_date,
          DATEDIFF(CURDATE(), i.admission_date) AS days_count,
          CONCAT('Hospitalised – ', COALESCE(i.dept_ward,'')) AS diagnosis,
          i.consultant      AS reporting_doctor,
          'ICF Hospital'    AS hospital_name,
          'IPD'             AS source
        FROM ipd_records i
        JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
        WHERE e.shop_code = ?
        ORDER BY i.admission_date DESC
      `, [shop_code]);

      // Merge — IPD first, then sick_fit not already in IPD
      const ipdEmis  = new Set(ipdRows.map(r => r.EMISCARDNUMBER));
      const sickOnly = sickRows.filter(r => !ipdEmis.has(r.EMISCARDNUMBER));
      const combined = [...ipdRows, ...sickOnly];

      return res.json({ success: true, data: combined });
    }
    res.json({ success: true, data: [] });
  } catch(err) {
    console.error('SSE employees list error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
