const authService = require('../services/auth.service');
const { validationResult } = require('express-validator');
const { generateToken } = require('../utils/JWTUtility');
const { sendMail } = require('../utils/mailer');
const User = require('../models/User.model');
const crypto = require("crypto");


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




// register: async (req, res) => {
//   try {
//     const { full_name, email, phone, password } = req.body;

//     // تحقق لو اليوزر موجود
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "The email address is already in use" });
//     }

//     // اعمل يوزر جديد
//     const user = new User({ full_name, email, phone, password, isVerified: false });

//     // توليد OTP
//     const otp = generateOTP();


//     await user.save();

//     // إرسال OTP على الإيميل
//     await sendMail(
//       email,
//       full_name,
//       otp
//     );

//     res.json({ message: "User registered successfully. Please verify your email." });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// },

// verifyEmail: async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: "User not found" });

//     if (user.otp !== otp || Date.now() > user.otpExpires) {
//       return res.status(400).json({ message: "Invalid or expired OTP" });
//     }

//     user.isVerified = true;
//     user.otp = null;
//     user.otpExpires = null;
//     await user.save();

//     res.json({ message: "Email verified successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// },


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

      const firebaseUser = await authService.signInWithEmail(email, password);
      if (!firebaseUser) {
        return res.status(401).json({ message: 'Invalid Firebase credentials' });
      }

      const user = await User.findOne({ firebase_uid: firebaseUser.firebase_uid }).select('+password');
      if (!user) {
        return res.status(404).json({ message: 'User not found in DB' });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      if (!user.is_active) {
       // return res.status(403).json({ message: 'User is inactive' });
        return res.status(403).json({ message: 'Email not verified' });
      }

      const token = generateToken(user)
      res.json({
        token,
        user: user.toPublicJSON(),
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ message: 'Invalid Firebase ID token' });
    }
  },

  oauth: async (req, res) => {
    try {
      const { token } = req.body;
      const user = await authService.handleOAuthSignIn(token);
      if (!user) {
        return res.status(404).json({ message: 'Invalid credentials' });
      }

      // const isPasswordValid = await user.comparePassword(password);
      // if (!isPasswordValid) {
      //   return res.status(401).json({ message: 'Invalid credentials' });
      // }
      if (!user.is_active) {
        return res.status(403).json({ message: 'User is inactive' });
      }

      const Jwttoken = generateToken(user)
      res.json({
        Jwttoken,
        user: user,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ message: 'Email not verified' });
    }

    //   res.json(user);
    // } catch (error) {
    //   res.status(401).json({ message: error.message });
    // }
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


