const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
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
    password: {
      type: String,
      select: false, // Password won't be returned in queries by default
    },
    role: {
      type: String,
      enum: ['regular', 'super'], // Regular or Super Admin
      default: 'regular',
    },
    is_active: { type: Boolean, default: true },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Middleware to hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method for soft delete
adminSchema.statics.softDelete = async function (adminId) {
  return this.findByIdAndUpdate(adminId, {
    deleted_at: new Date(),
    is_active: false,
  });
};

// Instance method to generate public profile
adminSchema.methods.toPublicJSON = function () {
  const admin = this.toObject();
  delete admin.password;
  delete admin.__v;
  return admin;
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
