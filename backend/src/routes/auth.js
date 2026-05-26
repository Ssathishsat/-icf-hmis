const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

let pool;
try { pool = require('../config/db'); } catch(e) { pool = null; }
const isDbAvailable = async () => {
  if (!pool) return false;
  try { await pool.execute('SELECT 1 FROM users LIMIT 1'); return true; } catch(e) { return false; }
};

// Demo users (used when DB is unavailable)
const DEMO_USERS = [
  { user_id: 1, username: 'admin',   full_name: 'System Administrator',          email: 'admin@icf.railnet.gov.in',   role: 'Admin', shop_code: null },
  { user_id: 2, username: 'pcmo',    full_name: 'Principal Chief Medical Officer', email: 'pcmo@icf.railnet.gov.in',    role: 'Admin', shop_code: null },
  { user_id: 3, username: 'sse_cmc', full_name: 'RAJESH KUMAR',                  email: 'sse.cmc@icf.railnet.gov.in', role: 'SSE',   shop_code: 'CMC' },
  { user_id: 4, username: 'sse_wrs', full_name: 'VENKATESH P',                   email: 'sse.wrs@icf.railnet.gov.in', role: 'SSE',   shop_code: 'WRS' },
  { user_id: 5, username: 'sse_els', full_name: 'ARUMUGAM S',                    email: 'sse.els@icf.railnet.gov.in', role: 'SSE',   shop_code: 'ELS' },
];

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    let user = null;

    if (await isDbAvailable()) {
      const [rows] = await pool.execute('SELECT * FROM users WHERE username=? AND is_active=1', [username]);
      if (rows.length > 0) {
        const dbUser = rows[0];
        const isValid = password === 'Admin@123'; // demo mode
        if (!isValid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        await pool.execute('UPDATE users SET last_login=NOW() WHERE user_id=?', [dbUser.user_id]);
        user = dbUser;
      }
    }

    // Fallback to demo users
    if (!user) {
      user = DEMO_USERS.find(u => u.username === username);
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      if (password !== 'Admin@123') return res.status(401).json({ success: false, message: 'Invalid credentials. Use Admin@123' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, full_name: user.full_name, role: user.role, shop_code: user.shop_code },
      process.env.JWT_SECRET || 'icf_hmis_super_secret_jwt_key_2024',
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { user_id: user.user_id, username: user.username, full_name: user.full_name, email: user.email, role: user.role, shop_code: user.shop_code }
    });
  } catch(err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
