const admin = require('../config/firebase');
const User = require('../models/User.model');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

class AuthService {
  constructor() {
    this.transporter =
      process.env.NODE_ENV === 'development'
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_PASS,
            },
          })
        : nodemailer.createTransport({
          host: "live.smtp.mailtrap.io",
          port: 587,
          auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
          },
            // Adding timeout and connection timeout settings
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 10000,
            // Adding debug option to help troubleshoot connection issues
            debug: true,
            logger: true,
          });

    // Store OTPs temporarily (in production, use Redis or similar)
    this.otpStore = new Map();
  }

  // Add a connection verification method
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('Mailtrap connection verified successfully');
    } catch (error) {
      console.error('Mailtrap connection verification failed:', {
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        errorStack: error.stack,
      });
      // Don't throw the error - let the service continue but log the issue
    }
  }

  // Generate OTP
  generateOTP() {
    return crypto.randomInt(1000, 9999).toString();
  }

  async sendOTP(email, otp) {
    const mailOptions = {
      from: {
       // address: 'hello@example.com',
       address: 'noreply@demomailtrap.co',
        name: 'Deals App',
      },
      to: email,
      subject: 'Email Verification OTP',
      html: `
        <h1>Email Verification</h1>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  storeOTP(email, otp) {
    this.otpStore.set(email, {
      otp,
      expires: Date.now() + 600000, // 10 minutes
    });
  }

  verifyOTP(email, otp) {
    const storedData = this.otpStore.get(email);
    if (!storedData) return false;
    if (Date.now() > storedData.expires) {
      this.otpStore.delete(email);
      return false;
    }
    return storedData.otp === otp;
  }

  async registerWithEmail(userData) {
    try {
      const firebaseUser = await admin.auth().createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.full_name,
      });

      const otp = this.generateOTP();
      await this.sendOTP(userData.email, otp);
      this.storeOTP(userData.email, otp);

      // Create user in MongoDB (but mark as unverified)
      const user = new User({
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        firebase_uid: firebaseUser.uid,
        is_active: false, // Will be activated after email verification
      });

      await user.save();

      return { userId: user._id, email: user.email };
    } catch (error) {
      if (error.uid) {
        await admin.auth().deleteUser(error.uid);
      }
      throw error;
    }
  }

  async verifyEmail(email, otp) {
    if (!this.verifyOTP(email, otp)) {
      throw new Error('Invalid or expired OTP');
    }

    const user = await User.findOneAndUpdate(
      { email },
      { is_active: true },
      { new: true },
    );

    await admin.auth().updateUser(user.firebase_uid, {
      emailVerified: true,
    });

    this.otpStore.delete(email);
    return user.toPublicJSON();
  }

  async signInWithEmail(email, password) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('User not found');
    }
    if (!user.is_active) {
      throw new Error('Email not verified');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    return user.toPublicJSON();
  }

  async handleOAuthSignIn(token) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const { uid, email, name, picture, firebase , phone_number} = decodedToken;

      let user = await User.findOne({ firebase_uid: uid });

      if (firebase.sign_in_provider === 'password' && !user.is_active) {
        throw new Error('Email not verified');
      }

      if (!user) {
        user = new User({
          full_name: name,
          email,
          firebase_uid: uid,
          profile_image: { url: picture },
          is_active: true,
          phone: phone_number || null,
        //  phone: null,
        });
        await user.save();
      }

      return user.toPublicJSON();
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async resendOTP(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    const otp = this.generateOTP();
    await this.sendOTP(email, otp);
    this.storeOTP(email, otp);

    return { message: 'OTP sent successfully' };
  }

  async sendForgotPasswordOTP(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    const otp = this.generateOTP();
    await this.sendOTP(email, otp);
    this.storeOTP(email, otp);
  }

  async verifyForgotPasswordOTP(email, otp) {
    return this.verifyOTP(email, otp);
  }

  async resetUserPassword(email, otp, newPassword) {
    if (!this.verifyOTP(email, otp)) {
      throw new Error('Invalid or expired OTP');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('User not found');
    }

    user.password = newPassword;
    user.markModified('password');
    console.log('Saving new password', user);
    await user.save();

    const firebaseUser = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(firebaseUser.uid, {
      password: newPassword,
    });

    this.otpStore.delete(email);

    return { message: 'Password updated successfully' };
  }

  async revokeUserTokens(firebaseUid) {
    try {
      await admin.auth().revokeRefreshTokens(firebaseUid);

      const userRecord = await admin.auth().getUser(firebaseUid);
      console.log(
        `Tokens revoked for user ${userRecord.email} at ${new Date()}`,
      );
      return { message: 'Tokens revoked successfully' };
    } catch (error) {
      throw new Error('Failed to revoke tokens');
    }
  }

  async deleteAccount(firebase_uid) {
    try {
      const user = await User.findOne({firebase_uid});
      //const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      await admin.auth().deleteUser(user.firebase_uid);
      await user.deleteOne();
      return { message: 'User account deleted successfully' };
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw new Error('Failed to delete user account');
    }
  }

  async changeUserPassword(email, currentPassword, newPassword) {
    const user = await User.findOne({ email }).select('+password');
  
    if (!user) {
      throw new Error('User not found');
    }
  
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }
  
    user.password = newPassword;
    user.markModified('password');
    await user.save();
  
    const firebaseUser = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(firebaseUser.uid, {
      password: newPassword,
    });
  
    return { message: 'Password changed successfully' };
  }
}

module.exports = new AuthService();
