const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin.model');

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: No token provided' });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decodedToken.id);

    if (!admin) {
      return res
        .status(403)
        .json({ message: 'Forbidden: Admin not found in the system' });
    }

    if (!admin.is_active) {
      return res
        .status(403)
        .json({ message: 'Forbidden: Admin account is inactive' });
    }

    req.admin = admin;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.admin.role)) {
      return res
        .status(403)
        .json({
          message:
            'Forbidden: You do not have permission to perform this action',
        });
    }
    next();
  };
};

module.exports = { authenticateAdmin, authorizeRole };
