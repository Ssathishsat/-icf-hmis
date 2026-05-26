const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/auth');

let pool;
try { pool = require('../config/db'); } catch(e) { pool = null; }

// Build WHERE for sick_fit_records (alias r, employees alias e)
function buildWhere(query, useDate = true) {
  const { from_date, to_date, shop_code, sf_code, gender } = query;
  const fromDate = from_date || '2022-01-01';
  const toDate   = to_date   || '2026-12-31';
  const conditions = [];
  const params = [];
  if (useDate) { conditions.push('r.sick_date BETWEEN ? AND ?'); params.push(fromDate, toDate); }
  if (shop_code) { conditions.push('e.shop_code = ?'); params.push(shop_code); }
  if (sf_code)   { conditions.push('e.sf_code = ?');   params.push(sf_code); }
  if (gender)    { conditions.push('e.gender = ?');    params.push(gender); }
  return { where: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '', params };
}

// Build WHERE for ipd_records (alias i, employees alias e)
function buildIpdWhere(query) {
  const { shop_code, sf_code, gender } = query;
  const conditions = [];
  const params = [];
  if (shop_code) { conditions.push('e.shop_code = ?'); params.push(shop_code); }
  if (sf_code)   { conditions.push('e.sf_code = ?');   params.push(sf_code); }
  if (gender)    { conditions.push('e.gender = ?');    params.push(gender); }
  return { where: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '', params };
}

// GET /api/dashboard/kpi
router.get('/kpi', authenticateToken, async (req, res) => {
  try {
    const { where: sickWhere, params: sickParams } = buildWhere(req.query, true);
    const { where: sickWhereND, params: sickParamsND } = buildWhere(req.query, false);
    const { where: ipdWhere, params: ipdParams } = buildIpdWhere(req.query);

    // 1. Total = sick_fit_records UNION ipd_records (deduplicated)
    // Note: IPD records with future dates are still real employees — include all
    const [[{ total_sick_cases }]] = await pool.execute(`
      SELECT COUNT(DISTINCT EMISCARDNUMBER) AS total_sick_cases FROM (
        SELECT r.EMISCARDNUMBER FROM sick_fit_records r
        JOIN employees e ON r.EMISCARDNUMBER = e.EMISCARDNUMBER ${sickWhere}
        UNION
        SELECT i.EMISCARDNUMBER FROM ipd_records i
        JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER ${ipdWhere}
      ) combined
    `, [...sickParams, ...ipdParams]);

    // 2. Supervisory
    const [[{ total_supervisory }]] = await pool.execute(`
      SELECT COUNT(DISTINCT EMISCARDNUMBER) AS total_supervisory FROM (
        SELECT r.EMISCARDNUMBER FROM sick_fit_records r
        JOIN employees e ON r.EMISCARDNUMBER = e.EMISCARDNUMBER
        ${sickWhere ? sickWhere + ' AND' : 'WHERE'} e.category = 'Supervisory'
        UNION
        SELECT i.EMISCARDNUMBER FROM ipd_records i
        JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
        ${ipdWhere ? ipdWhere + ' AND' : 'WHERE'} e.category = 'Supervisory'
      ) combined
    `, [...sickParams, ...ipdParams]);

    // 3. Non-Supervisory
    const [[{ total_non_supervisory }]] = await pool.execute(`
      SELECT COUNT(DISTINCT EMISCARDNUMBER) AS total_non_supervisory FROM (
        SELECT r.EMISCARDNUMBER FROM sick_fit_records r
        JOIN employees e ON r.EMISCARDNUMBER = e.EMISCARDNUMBER
        ${sickWhere ? sickWhere + ' AND' : 'WHERE'} e.category = 'Non-Supervisory'
        UNION
        SELECT i.EMISCARDNUMBER FROM ipd_records i
        JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
        ${ipdWhere ? ipdWhere + ' AND' : 'WHERE'} e.category = 'Non-Supervisory'
      ) combined
    `, [...sickParams, ...ipdParams]);

    // 4. Last 7 Days Cases (matching Weekly Reports logic, no future dates)
    const [[{ current_week_cases }]] = await pool.execute(`
      SELECT COUNT(DISTINCT EMISCARDNUMBER) AS current_week_cases FROM (
        SELECT r.EMISCARDNUMBER FROM sick_fit_records r
        JOIN employees e ON r.EMISCARDNUMBER = e.EMISCARDNUMBER
        ${sickWhereND ? sickWhereND + ' AND' : 'WHERE'}
          r.sick_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND r.sick_date <= CURDATE()
        UNION
        SELECT i.EMISCARDNUMBER FROM ipd_records i
        JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
        ${ipdWhere ? ipdWhere + ' AND' : 'WHERE'}
          i.admission_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND i.admission_date <= CURDATE()
      ) combined
    `, [...sickParamsND, ...ipdParams]);

    // 5. Monthly Cases (no future dates)
    const [[{ monthly_cases }]] = await pool.execute(`
      SELECT COUNT(DISTINCT EMISCARDNUMBER) AS monthly_cases FROM (
        SELECT r.EMISCARDNUMBER FROM sick_fit_records r
        JOIN employees e ON r.EMISCARDNUMBER = e.EMISCARDNUMBER
        ${sickWhereND ? sickWhereND + ' AND' : 'WHERE'}
          MONTH(r.sick_date) = MONTH(CURDATE()) AND YEAR(r.sick_date) = YEAR(CURDATE())
        UNION
        SELECT i.EMISCARDNUMBER FROM ipd_records i
        JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
        ${ipdWhere ? ipdWhere + ' AND' : 'WHERE'}
          MONTH(i.admission_date) = MONTH(CURDATE()) AND YEAR(i.admission_date) = YEAR(CURDATE())
          AND i.admission_date <= CURDATE()
      ) combined
    `, [...sickParamsND, ...ipdParams]);

    // 6. Shops Affected (all IPD records, future dates are still real employees)
    const [[{ shops_affected }]] = await pool.execute(`
      SELECT COUNT(DISTINCT shop_code) AS shops_affected FROM (
        SELECT e.shop_code FROM sick_fit_records r
        JOIN employees e ON r.EMISCARDNUMBER = e.EMISCARDNUMBER
        ${sickWhere ? sickWhere + ' AND' : 'WHERE'} e.shop_code IS NOT NULL AND e.shop_code != 'ICF'
        UNION
        SELECT e.shop_code FROM ipd_records i
        JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
        ${ipdWhere ? ipdWhere + ' AND' : 'WHERE'} e.shop_code IS NOT NULL AND e.shop_code != 'ICF'
      ) combined
    `, [...sickParams, ...ipdParams]);

    // 7. Active SSE Count — only Supervisory category CUG contacts
    let sseQuery = `SELECT COUNT(DISTINCT c.EMISCARDNUMBER) AS active_sse_count
      FROM cug_contacts c JOIN employees e ON c.EMISCARDNUMBER=e.EMISCARDNUMBER
      WHERE c.is_active=1 AND e.category='Supervisory'`;
    let sseParams = [];
    if (req.query.sf_code) {
      sseQuery += ' AND e.sf_code = ?';
      sseParams.push(req.query.sf_code);
    }
    const [[{ active_sse_count }]] = await pool.execute(sseQuery, sseParams);

    return res.json({ success: true, data: {
      total_sick_cases, total_supervisory, total_non_supervisory,
      current_week_cases, monthly_cases, shops_affected, active_sse_count
    }});
  } catch(err) {
    console.error('KPI error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/daywise-trend — include IPD admissions
router.get('/daywise-trend', authenticateToken, async (req, res) => {
  try {
    const { where, params } = buildWhere(req.query, true);
    const { where: ipdWhere, params: ipdParams } = buildIpdWhere(req.query);
    const { from_date = '2022-01-01', to_date = '2026-12-31' } = req.query;

    const [rows] = await pool.execute(`
      SELECT trend_date, COUNT(*) AS sick_count, 0 AS fit_count, COUNT(*) AS total_count
      FROM (
        SELECT DATE(r.sick_date) AS trend_date FROM sick_fit_records r
        JOIN employees e ON r.EMISCARDNUMBER = e.EMISCARDNUMBER ${where}
        UNION ALL
        SELECT DATE(i.admission_date) AS trend_date FROM ipd_records i
        JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
        ${ipdWhere ? ipdWhere + ' AND' : 'WHERE'} i.admission_date BETWEEN ? AND ? AND i.admission_date <= CURDATE()
      ) combined
      GROUP BY trend_date ORDER BY trend_date
    `, [...params, ...ipdParams, from_date, to_date]);

    return res.json({ success: true, data: rows });
  } catch(err) {
    console.error('Daywise trend error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/shop-distribution — include IPD
router.get('/shop-distribution', authenticateToken, async (req, res) => {
  try {
    const { from_date = '2022-01-01', to_date = '2026-12-31', shop_code, sf_code, gender } = req.query;
    const conditions = ['r.sick_date BETWEEN ? AND ?'];
    const params = [from_date, to_date];
    if (shop_code) { conditions.push('s.shop_code = ?'); params.push(shop_code); }
    if (sf_code)   { conditions.push('e.sf_code = ?');   params.push(sf_code); }
    if (gender)    { conditions.push('e.gender = ?');    params.push(gender); }
    const where = 'WHERE ' + conditions.join(' AND ');

    const [rows] = await pool.execute(`
      SELECT s.shop_code, s.shop_name, s.department,
        COUNT(DISTINCT e.EMISCARDNUMBER) AS total_employees,
        COUNT(r.record_id) AS sick_count,
        0 AS fit_count,
        COUNT(r.record_id) AS total_cases
      FROM shops s
      LEFT JOIN employees e ON s.shop_code = e.shop_code
      LEFT JOIN sick_fit_records r ON e.EMISCARDNUMBER = r.EMISCARDNUMBER
      ${where}
      GROUP BY s.shop_code, s.shop_name, s.department
      ORDER BY total_cases DESC, total_employees DESC
      LIMIT 30
    `, params);

    return res.json({ success: true, data: rows });
  } catch(err) {
    console.error('Shop distribution error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/category-distribution
router.get('/category-distribution', authenticateToken, async (req, res) => {
  try {
    const { where, params } = buildWhere(req.query, true);
    const { where: ipdWhere, params: ipdParams } = buildIpdWhere(req.query);

    const [rows] = await pool.execute(`
      SELECT category, COUNT(DISTINCT EMISCARDNUMBER) AS sick_employees FROM (
        SELECT e.category, r.EMISCARDNUMBER FROM sick_fit_records r
        JOIN employees e ON r.EMISCARDNUMBER = e.EMISCARDNUMBER ${where}
        UNION
        SELECT e.category, i.EMISCARDNUMBER FROM ipd_records i
        JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER ${ipdWhere}
      ) combined GROUP BY category
    `, [...params, ...ipdParams]);

    return res.json({ success: true, data: rows });
  } catch(err) {
    console.error('Category distribution error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/division-stats — include IPD
router.get('/division-stats', authenticateToken, async (req, res) => {
  try {
    const { where, params } = buildWhere(req.query, true);
    const { where: ipdWhere, params: ipdParams } = buildIpdWhere(req.query);

    const [rows] = await pool.execute(`
      SELECT sf_code, gender, COUNT(DISTINCT EMISCARDNUMBER) AS count FROM (
        SELECT e.sf_code, e.gender, r.EMISCARDNUMBER FROM sick_fit_records r
        JOIN employees e ON r.EMISCARDNUMBER = e.EMISCARDNUMBER
        ${where ? where + ' AND' : 'WHERE'} e.sf_code IN ('Fur','Shell')
        UNION
        SELECT e.sf_code, e.gender, i.EMISCARDNUMBER FROM ipd_records i
        JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
        ${ipdWhere ? ipdWhere + ' AND' : 'WHERE'} e.sf_code IN ('Fur','Shell')
      ) combined GROUP BY sf_code, gender
    `, [...params, ...ipdParams]);

    const stats = { Fur: { Male:0, Female:0, Total:0 }, Shell: { Male:0, Female:0, Total:0 } };
    rows.forEach(r => {
      if (stats[r.sf_code] && (r.gender==='Male'||r.gender==='Female')) {
        stats[r.sf_code][r.gender] = parseInt(r.count);
        stats[r.sf_code].Total += parseInt(r.count);
      }
    });
    return res.json({ success: true, data: stats });
  } catch(err) {
    console.error('Division stats error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/recent-sick — include IPD
router.get('/recent-sick', authenticateToken, async (req, res) => {
  try {
    const { where, params } = buildWhere(req.query, true);
    const { where: ipdWhere, params: ipdParams } = buildIpdWhere(req.query);

    const [rows] = await pool.execute(`
      SELECT EMISCARDNUMBER, empno, emp_name, designation, department, shop_code, last_sick_date
      FROM (
        SELECT e.EMISCARDNUMBER, e.empno, e.emp_name, e.designation,
               e.department, e.shop_code, r.sick_date AS last_sick_date
        FROM sick_fit_records r JOIN employees e ON r.EMISCARDNUMBER=e.EMISCARDNUMBER ${where}
        UNION
        SELECT e.EMISCARDNUMBER, e.empno, e.emp_name, e.designation,
               e.department, e.shop_code, i.admission_date AS last_sick_date
        FROM ipd_records i JOIN employees e ON i.EMISCARDNUMBER=e.EMISCARDNUMBER ${ipdWhere}
      ) combined
      ORDER BY last_sick_date DESC LIMIT 10
    `, [...params, ...ipdParams]);

    return res.json({ success: true, data: rows });
  } catch(err) {
    console.error('Recent sick error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
