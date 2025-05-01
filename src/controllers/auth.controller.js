const authService = require('../services/auth.service');
const { validationResult } = require('express-validator');

const controller = {
  register: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await authService.registerWithEmail(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  verifyEmail: async (req, res) => {
    try {
      const { email, otp } = req.body;
      const user = await authService.verifyEmail(email, otp);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await authService.signInWithEmail(email, password);
      res.json(user);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  },

  oauth: async (req, res) => {
    try {
      const { token } = req.body;
      const user = await authService.handleOAuthSignIn(token);
      res.json(user);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  },

  resendOTP: async (req, res) => {
    try {
      const { email } = req.body;
      const result = await authService.resendOTP(email);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Initiate forgot password process
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      await authService.sendForgotPasswordOTP(email);
      res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Verify OTP for password reset
  verifyOTPForReset: async (req, res) => {
    try {
      const { email, otp } = req.body;
      const isValid = await authService.verifyForgotPasswordOTP(email, otp);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
      res.json({ message: 'OTP verified successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Reset password
  resetPassword: async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await authService.resetUserPassword(
        email,
        otp,
        newPassword,
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  logout: async (req, res) => {
    try {
      const { firebase_uid } = req.body;

      if (!firebase_uid) {
        return res.status(400).json({ message: 'Firebase UID is required' });
      }

      // Call the service method to revoke tokens
      const result = await authService.revokeUserTokens(firebase_uid);

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },


  changePassword: async (req, res) => {
    try {
      const { email, currentPassword, newPassword } = req.body;
  
      if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
  
      const result = await authService.changeUserPassword(email, currentPassword, newPassword);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },


};


module.exports = controller;
