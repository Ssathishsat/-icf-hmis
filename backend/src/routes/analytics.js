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

// Helper to construct dynamic WHERE criteria for analytics queries
function buildWhere(query, useDateRange = false) {
  const { from_date, to_date, shop_code, sf_code, gender } = query;
  const conditions = [];
  const params = [];

  if (useDateRange) {
    const fromDate = from_date || new Date(Date.now() - 365*24*60*60*1000).toISOString().split('T')[0];
    const toDate   = to_date   || new Date().toISOString().split('T')[0];
    conditions.push('r.sick_date BETWEEN ? AND ?');
    params.push(fromDate, toDate);
  }

  if (shop_code) { conditions.push('e.shop_code = ?'); params.push(shop_code); }
  if (sf_code)   { conditions.push('e.sf_code = ?');   params.push(sf_code); }
  if (gender)    { conditions.push('e.gender = ?');    params.push(gender); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  return { where, params };
}

router.get('/weekly', authenticateToken, async (req, res) => {
  try {
    if (await isDbAvailable()) {
      const { weeks = 8 } = req.query;
      const { where, params } = buildWhere(req.query, false);

      const sqlWhere = where
        ? `${where} AND r.sick_date >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)`
        : 'WHERE r.sick_date >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)';

      const [rows] = await pool.execute(`
        SELECT yr, wk, MIN(event_date) AS week_start,
          COUNT(*) AS sick_count, 0 AS fit_count, COUNT(*) AS total_count
        FROM (
          SELECT YEAR(r.sick_date) AS yr, WEEK(r.sick_date,1) AS wk, r.sick_date AS event_date,
                 r.EMISCARDNUMBER
          FROM sick_fit_records r
          JOIN employees e ON r.EMISCARDNUMBER=e.EMISCARDNUMBER
          ${sqlWhere}
          UNION ALL
          SELECT YEAR(i.admission_date), WEEK(i.admission_date,1), i.admission_date,
                 i.EMISCARDNUMBER
          FROM ipd_records i
          JOIN employees e ON i.EMISCARDNUMBER=e.EMISCARDNUMBER
          WHERE i.admission_date >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
        ) combined
        GROUP BY yr, wk ORDER BY yr, wk
      `, [...params, parseInt(weeks), parseInt(weeks)]);
      return res.json({ success: true, data: rows });
    }
    res.json({ success: true, data: mock.generateWeeklyData() });
  } catch(err) { res.json({ success: true, data: mock.generateWeeklyData() }); }
});

router.get('/monthly', authenticateToken, async (req, res) => {
  try {
    if (await isDbAvailable()) {
      const { months = 12 } = req.query;
      const { where, params } = buildWhere(req.query, false);

      const sqlWhere = where
        ? `${where} AND r.sick_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)`
        : 'WHERE r.sick_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)';

      const [rows] = await pool.execute(`
        SELECT yr, mo, DATE_FORMAT(STR_TO_DATE(CONCAT(yr,'-',mo,'-01'),'%Y-%m-%d'),'%b %Y') AS month_label,
          COUNT(*) AS sick_count, 0 AS fit_count, COUNT(*) AS total_count
        FROM (
          SELECT YEAR(r.sick_date) AS yr, MONTH(r.sick_date) AS mo, r.EMISCARDNUMBER
          FROM sick_fit_records r
          JOIN employees e ON r.EMISCARDNUMBER=e.EMISCARDNUMBER
          ${sqlWhere}
          UNION ALL
          SELECT YEAR(i.admission_date), MONTH(i.admission_date), i.EMISCARDNUMBER
          FROM ipd_records i
          JOIN employees e ON i.EMISCARDNUMBER=e.EMISCARDNUMBER
          WHERE i.admission_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
        ) combined
        GROUP BY yr, mo ORDER BY yr, mo
      `, [...params, parseInt(months), parseInt(months)]);
      return res.json({ success: true, data: rows });
    }
    res.json({ success: true, data: mock.generateMonthlyData() });
  } catch(err) { res.json({ success: true, data: mock.generateMonthlyData() }); }
});

router.get('/department-trends', authenticateToken, async (req, res) => {
  try {
    if (await isDbAvailable()) {
      const { where, params } = buildWhere(req.query, true);
      const [rows] = await pool.execute(`
        SELECT e.department,
          SUM(CASE WHEN r.fit_date IS NULL THEN 1 ELSE 0 END) AS sick_count,
          SUM(CASE WHEN r.fit_date IS NOT NULL THEN 1 ELSE 0 END) AS fit_count,
          COUNT(*) AS total_count
        FROM sick_fit_records r 
        JOIN employees e ON r.EMISCARDNUMBER=e.EMISCARDNUMBER
        ${where}
        GROUP BY e.department 
        ORDER BY total_count DESC
      `, params);
      return res.json({ success: true, data: rows });
    }
    res.json({ success: true, data: mock.deptTrends });
  } catch(err) { res.json({ success: true, data: mock.deptTrends }); }
});

router.get('/sse-performance', authenticateToken, async (req, res) => {
  try {
    if (await isDbAvailable()) {
      const { from_date, to_date, sf_code } = req.query;
      const fromDate = from_date || new Date(Date.now()-365*24*60*60*1000).toISOString().split('T')[0];
      const toDate = to_date || new Date().toISOString().split('T')[0];

      let sfFilter = sf_code ? 'AND e2.sf_code = ?' : '';
      const params = [fromDate, toDate];
      if (sf_code) params.push(sf_code);

      const [rows] = await pool.execute(`
        SELECT
          c.EMISCARDNUMBER,
          c.sse_name,
          c.shop_code,
          s.shop_name,
          c.cug_number,
          c.designation,
          COUNT(DISTINCT CASE WHEN r.fit_date IS NULL AND r.status='Sick' THEN r.record_id END) AS current_sick,
          COUNT(DISTINCT CASE WHEN r.status='Fit' THEN r.record_id END) AS recovered,
          COUNT(DISTINCT r.record_id) AS total_cases,
          ROUND(AVG(r.days_count),1) AS avg_recovery_days
        FROM (
          SELECT MIN(contact_id) AS contact_id, EMISCARDNUMBER,
                 MIN(sse_name) AS sse_name, MIN(cug_number) AS cug_number,
                 MIN(designation) AS designation, MIN(shop_code) AS shop_code
          FROM cug_contacts WHERE is_active=1
          GROUP BY EMISCARDNUMBER
          LIMIT 50
        ) c
        LEFT JOIN shops s ON c.shop_code = s.shop_code
        LEFT JOIN employees e2 ON e2.shop_code = c.shop_code
        LEFT JOIN sick_fit_records r
          ON e2.EMISCARDNUMBER = r.EMISCARDNUMBER
          AND r.sick_date BETWEEN ? AND ?
        WHERE 1=1 ${sfFilter}
        GROUP BY c.EMISCARDNUMBER, c.sse_name, c.shop_code, s.shop_name, c.cug_number, c.designation
        ORDER BY total_cases DESC, current_sick DESC
      `, params);
      return res.json({ success: true, data: rows });
    }
    res.json({ success: true, data: mock.ssePerformance });
  } catch(err) {
    console.error('SSE performance error:', err.message);
    res.json({ success: true, data: [] });
  }
});

router.get('/heatmap', authenticateToken, async (req, res) => {
  try {
    if (await isDbAvailable()) {
      const { where, params } = buildWhere(req.query, true);
      const [rows] = await pool.execute(`
        SELECT s.shop_code, s.shop_name, WEEK(r.sick_date,1) AS week_num,
          COUNT(*) AS case_count,
          CASE WHEN COUNT(*)>=5 THEN 'high' WHEN COUNT(*)>=3 THEN 'medium' ELSE 'low' END AS risk_level
        FROM sick_fit_records r
        JOIN employees e ON r.EMISCARDNUMBER=e.EMISCARDNUMBER
        JOIN shops s ON e.shop_code=s.shop_code
        ${where}
        GROUP BY s.shop_code, s.shop_name, WEEK(r.sick_date,1)
        ORDER BY s.shop_code, week_num
      `, params);
      return res.json({ success: true, data: rows });
    }
    res.json({ success: true, data: mock.heatmapData });
  } catch(err) { res.json({ success: true, data: mock.heatmapData }); }
});

router.get('/predictions', authenticateToken, async (req, res) => {
  try {
    const historical = mock.generateDayTrend().slice(-14).map(d => ({ trend_date: d.trend_date, daily_count: d.sick_count }));
    const avg = historical.reduce((s, d) => s + d.daily_count, 0) / historical.length;
    const trend = (historical[historical.length-1].daily_count - historical[0].daily_count) / historical.length;
    const predictions = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      predictions.push({ date: d.toISOString().split('T')[0], predicted_count: Math.max(0, Math.round(avg + trend * i)), confidence: Math.max(60, 90 - i * 3) });
    }
    res.json({ success: true, data: { historical, predictions, insights: { avg_daily: Math.round(avg), trend_direction: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable', risk_level: avg > 5 ? 'high' : avg > 2 ? 'medium' : 'low' } } });
  } catch(err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
