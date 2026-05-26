const express = require('express');
const router  = express.Router();
const { authenticateToken } = require('../middleware/auth');

let pool;
try { pool = require('../config/db'); } catch(e) { pool = null; }

// GET /api/ipd  — paginated IPD records joined with employee details
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1, limit = 20,
      search, shop_code, sf_code, gender, category,
      from_date, to_date, dept_ward,
    } = req.query;

    const offset     = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['i.EMISCARDNUMBER IS NOT NULL'];
    const params     = [];

    if (shop_code) { conditions.push('e.shop_code = ?');  params.push(shop_code); }
    if (sf_code)   { conditions.push('e.sf_code = ?');    params.push(sf_code); }
    if (gender)    { conditions.push('e.gender = ?');     params.push(gender); }
    if (category)  { conditions.push('e.category = ?');   params.push(category); }
    if (dept_ward) { conditions.push('i.dept_ward LIKE ?'); params.push(`%${dept_ward}%`); }

    if (from_date && to_date) {
      conditions.push('i.admission_date BETWEEN ? AND ?');
      params.push(from_date, to_date);
    } else if (from_date) {
      conditions.push('i.admission_date >= ?');
      params.push(from_date);
    } else if (to_date) {
      conditions.push('i.admission_date <= ?');
      params.push(to_date);
    }

    if (search) {
      conditions.push('(e.EMISCARDNUMBER LIKE ? OR e.emp_name LIKE ? OR e.empno LIKE ? OR i.patient_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    // Total count
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM ipd_records i
       LEFT JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
       ${where}`, params
    );

    const lim = parseInt(limit);
    const [rows] = await pool.query(`
      SELECT
        i.ipd_id,
        i.sl_no,
        i.cr_no,
        i.admission_no,
        i.patient_name,
        i.category_id,
        i.age_sex,
        i.mobile,
        i.dept_ward,
        i.admission_date,
        i.admission_time,
        i.acceptance_status,
        i.consultant,
        i.operator,
        e.EMISCARDNUMBER,
        e.empno,
        e.emp_name,
        e.designation,
        e.department,
        e.shop_code,
        e.payunit,
        e.sf_code,
        e.gender,
        e.category
      FROM ipd_records i
      LEFT JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
      ${where}
      ORDER BY i.admission_date DESC, i.sl_no ASC
      LIMIT ${lim} OFFSET ${offset}
    `, params);

    // Summary counts
    const [genderCounts] = await pool.execute(
      `SELECT e.gender, COUNT(*) AS cnt
       FROM ipd_records i
       LEFT JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
       ${where} GROUP BY e.gender`, params
    );
    const [sfCounts] = await pool.execute(
      `SELECT COALESCE(e.sf_code,'Unknown') AS sf_code, COUNT(*) AS cnt
       FROM ipd_records i
       LEFT JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
       ${where} GROUP BY e.sf_code`, params
    );
    const [wardCounts] = await pool.execute(
      `SELECT i.dept_ward, COUNT(*) AS cnt
       FROM ipd_records i
       LEFT JOIN employees e ON i.EMISCARDNUMBER = e.EMISCARDNUMBER
       ${where} GROUP BY i.dept_ward ORDER BY cnt DESC LIMIT 5`, params
    );

    const summary = { male: 0, female: 0, fur: 0, shell: 0, wards: wardCounts };
    for (const g of genderCounts) {
      if (g.gender === 'Male')   summary.male   = parseInt(g.cnt);
      if (g.gender === 'Female') summary.female = parseInt(g.cnt);
    }
    for (const s of sfCounts) {
      if (s.sf_code === 'Fur')   summary.fur   = parseInt(s.cnt);
      if (s.sf_code === 'Shell') summary.shell = parseInt(s.cnt);
    }

    const total = countRows[0].total;
    return res.json({
      success: true,
      data: rows,
      summary,
      pagination: {
        total,
        page:  parseInt(page),
        limit: lim,
        pages: Math.ceil(total / lim),
      },
    });
  } catch(err) {
    console.error('IPD route error:', err.message);
    res.status(500).json({ success: false, message: 'Database error: ' + err.message });
  }
});

module.exports = router;
