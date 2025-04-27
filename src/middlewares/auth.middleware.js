// src/middlewares/auth.middleware.js

const admin = require('../config/firebase');
const User = require('../models/User.model');

/**
 * Middleware to authenticate and authorize requests.
 * Verifies the Firebase ID token and ensures the user exists in the database.
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Extract the token from the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: Missing or invalid token' });
    }

    const idToken = authHeader.split(' ')[1];

    if (!idToken) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: No token provided' });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Extract user information from the decoded token
    const { email, uid } = decodedToken;

    // Check if the user exists in the database
    const user = await User.findOne({ firebase_uid: uid });

    if (!user) {
      return res
        .status(403)
        .json({ message: 'Forbidden: User not found in the system' });
    }

    if (!user.is_active) {
      return res
        .status(403)
        .json({ message: 'Forbidden: User account is inactive' });
    }

    // Attach the user data to the request object for use in subsequent handlers
    req.user = user;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

module.exports = authenticateUser;
