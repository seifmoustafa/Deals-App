// src/utils/jwt.js
const jwt = require('jsonwebtoken');


// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' } // 24 hours
  );
};

// Verify JWT
const verifyToken = (token) => {
  return jwt.verify(token,  process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
