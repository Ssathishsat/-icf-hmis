/**
 * Role-Based Access Control middleware
 * Usage: requireRole('Admin') or requireRole(['Admin', 'SSE'])
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
    next();
  };
};

/**
 * SSE shop restriction — SSE users can only see their own shop data
 */
const restrictToOwnShop = (req, res, next) => {
  if (req.user.role === 'Admin') return next(); // Admin sees all
  const requestedShop = req.query.shop_code || req.params.shop_code;
  if (requestedShop && requestedShop !== req.user.shop_code) {
    return res.status(403).json({
      success: false,
      message: 'SSE users can only access their assigned shop data'
    });
  }
  // Auto-inject shop filter for SSE
  if (req.user.role === 'SSE') {
    req.query.shop_code = req.user.shop_code;
  }
  next();
};

module.exports = { requireRole, restrictToOwnShop };
