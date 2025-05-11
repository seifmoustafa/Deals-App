

/**
 * Middleware to restrict some requests only for Admins.
 */

const authorizeAdminOnly = (req, res, next) => {
  if (!req.admin) {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }
  next();
};

module.exports = authorizeAdminOnly;
