const pool = require('../config/db');

const auditLog = (action, resource) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    try {
      await pool.execute(
        `INSERT INTO audit_logs (user_id, username, action, resource, ip_address, user_agent, response_status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user?.user_id || null,
          req.user?.username || 'anonymous',
          action,
          resource,
          req.ip,
          req.headers['user-agent'] || '',
          res.statusCode
        ]
      );
    } catch (e) {
      // Non-blocking — don't fail request if audit log fails
    }
    return originalJson(data);
  };
  next();
};

module.exports = { auditLog };
