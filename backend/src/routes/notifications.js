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
    if (await isDbAvailable()) {
      const [rows] = await pool.execute('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20');
      const [unread] = await pool.execute('SELECT COUNT(*) AS count FROM notifications WHERE is_read=0');
      return res.json({ success: true, data: rows, unread_count: unread[0].count });
    }
    res.json({ success: true, data: mock.notifications, unread_count: mock.notifications.filter(n => !n.is_read).length });
  } catch(err) { res.json({ success: true, data: mock.notifications, unread_count: 2 }); }
});

router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    if (await isDbAvailable()) {
      await pool.execute('UPDATE notifications SET is_read=1 WHERE notif_id=?', [req.params.id]);
    }
    res.json({ success: true });
  } catch(err) { res.json({ success: true }); }
});

router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    if (await isDbAvailable()) {
      await pool.execute('UPDATE notifications SET is_read=1');
    }
    res.json({ success: true });
  } catch(err) { res.json({ success: true }); }
});

module.exports = router;
