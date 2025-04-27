// src/models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    phone: {
      type: String,
      unique: true,
      trim: true,
      required: false,
      sparse: true,
    },
    data_of_birth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      select: false, // Password won't be returned in queries by default
    },
    firebase_uid: {
      type: String,
      unique: true,
      sparse: true, // Allows null values and maintains uniqueness for non-null values
    },
    profile_image: {
      url: String,
      path: String, // For Firebase Storage reference
    },
    fcm_tokens: [
      {
        type: String,
        // Store multiple FCM tokens for different devices
      },
    ],
    total_savings: {
      type: Number,
      default: 0,
    },
    favorite_stores: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
      },
    ],
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
      },
    ],
    last_login: {
      type: Date,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Index for soft delete queries
userSchema.index({ deleted_at: 1 });

// Middleware to handle soft deletes
userSchema.pre('find', function () {
  this.where({ deleted_at: null });
});

userSchema.pre('findOne', function () {
  this.where({ deleted_at: null });
});

// Instance method to generate public profile
userSchema.methods.toPublicJSON = function () {
  const user = this.toObject();
  delete user.password;
  // delete user.firebase_uid;
  delete user.fcm_tokens;
  delete user.__v;
  return user;
};

// Virtual for referral codes (if implemented)
userSchema.virtual('referral_codes', {
  ref: 'ReferralCode',
  localField: '_id',
  foreignField: 'user',
});

// Add Firebase-related methods
userSchema.methods.addFCMToken = async function (token) {
  if (!this.fcm_tokens.includes(token)) {
    this.fcm_tokens.push(token);
    await this.save();
  }
};

userSchema.methods.removeFCMToken = async function (token) {
  this.fcm_tokens = this.fcm_tokens.filter((t) => t !== token);
  await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
