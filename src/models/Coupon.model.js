// src/models/couponModel.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    // Basic Coupon Information
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      trim: true,
      uppercase: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Coupon title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // Discount Information
    discount_type: {
      type: String,
      enum: ['DISCOUNT', 'CASHBACK'],
      required: true,
    },
    discount_value: {
      type: Number,
      required: function () {
        return ['DISCOUNT', 'CASHBACK'].includes(this.discount_type);
      },
    },
    minimum_purchase: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD',
      },
    },

    // Validation and Terms
    terms_and_conditions: [String],
    valid_for: {
      type: String,
      enum: ['new users', 'existing users', 'new and existing users'],
    },

    // Time-based Fields
    start_date: {
      type: Date,
      default: Date.now,
    },
    expiry_date: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },

    // Usage Stats
    usage_limit: {
      total: Number,
      per_user: Number,
    },
    usage_count: {
      type: Number,
      default: 0,
    },
    success_rate: {
      type: mongoose.Schema.Types.Double,
      default: 0.0, // Percentage of successful uses
    },

    // User Interaction
    verified_by: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        verified_at: {
          type: Date,
          default: Date.now,
        },
        worked: Boolean,
      },
    ],
    reported_not_working: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        reported_at: {
          type: Date,
          default: Date.now,
        },
        reason: String,
      },
    ],

    // User Experience
    average_savings: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD',
      },
    },
    popularity_score: {
      type: mongoose.Schema.Types.Double,
      default: 0.0,
    },

    // Status Fields
    is_verified: {
      type: Boolean,
      default: false,
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'DELETED', 'SUSPENDED'],
      default: 'ACTIVE',
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

// Indexes
couponSchema.index({ store: 1, code: 1 }, { unique: true });
couponSchema.index({ deleted_at: 1 });
couponSchema.index({ expiry_date: 1 });
couponSchema.index({ status: 1 });
couponSchema.index({ is_featured: 1 });
couponSchema.index({ popularity_score: -1 });
couponSchema.index({ 'verified_by.worked': 1 });

// Middleware for soft deletes
couponSchema.pre('find', function () {
  this.where({ deleted_at: null });
});

couponSchema.pre('findOne', function () {
  this.where({ deleted_at: null });
});

// Update status based on various conditions
couponSchema.pre('save', async function (next) {
  const now = new Date();

  if (this.expiry_date < now) {
    this.status = 'EXPIRED';
    this.is_active = false;
  } else if (
    this.usage_limit?.total &&
    this.usage_count >= this.usage_limit.total
  ) {
    this.status = 'DEPLETED';
    this.is_active = false;
  } else if (this.is_active) {
    this.status = 'ACTIVE';
  }

  next();
});

// Methods
couponSchema.methods.verify = async function (userId, worked) {
  const verification = {
    user: userId,
    verified_at: new Date(),
    worked,
  };

  this.verified_by.push(verification);

  // Update success rate
  const totalVerifications = this.verified_by.length;
  const successfulVerifications = this.verified_by.filter(
    (v) => v.worked,
  ).length;
  this.success_rate = (successfulVerifications / totalVerifications) * 100;

  return this.save();
};

couponSchema.methods.reportNotWorking = async function (userId, reason) {
  const report = {
    user: userId,
    reported_at: new Date(),
    reason,
  };

  this.reported_not_working.push(report);
  return this.save();
};

couponSchema.methods.updatePopularityScore = async function () {
  // Calculate popularity based on various factors
  const verificationWeight = 0.4;
  const successRateWeight = 0.3;
  const usageWeight = 0.3;

  const verificationScore = this.verified_by.length * 10;
  const successRateScore = this.success_rate;
  const usageScore = this.usage_count * 10;

  this.popularity_score =
    verificationScore * verificationWeight +
    successRateScore * successRateWeight +
    usageScore * usageWeight;

  return this.save();
};

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
