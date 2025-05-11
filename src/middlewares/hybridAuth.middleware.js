const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Admin = require('../models/Admin.model');


/**
 * Middleware to authenticate and authorize requests.
 * Verifies the Firebase ID token and determine the type of the user or admin.
 * Authorize both models User and Admin.
 */


const hybridAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try to find as Admin first
    const admin = await Admin.findById(decoded.id);
    if (admin && admin.is_active) {
      req.admin = admin;
      return next();
    }

    // Try to find as User
    const user = await User.findById(decoded.id);
    if (user && user.is_active && !user.deleted_at) {
      req.user = user;
      return next();
    }

    return res.status(403).json({ message: 'Forbidden: Invalid identity' });
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

module.exports = hybridAuth;
