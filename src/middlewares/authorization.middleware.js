// src/middlewares/authenticateJwt.middleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');


const authenticateJwt = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || !user.is_active || user.deleted_at) {
      return res.status(403).json({ message: 'Forbidden: Invalid user' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

module.exports = authenticateJwt;
