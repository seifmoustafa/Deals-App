const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const { body } = require('express-validator');

// Validation middleware
const validateRegistration = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('full_name').trim().notEmpty(),
];

// Register with email/password
router.post('/register', validateRegistration, controller.register);

router.post('/verify-email', controller.verifyEmail);

router.post('/login', controller.login);

router.post('/oauth', controller.oauth);

router.post('/resend-otp', controller.resendOTP);

router.post('/forgot-password', controller.forgotPassword);

router.post('/verify-otp', controller.verifyOTPForReset);

router.post('/reset-password', controller.resetPassword);

router.post('/logout', controller.logout);

router.post('/change-password', controller.changePassword);

module.exports = router;
