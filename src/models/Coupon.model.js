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
    country: {
      type: String,
      required: true,
      trim: true
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
      enum: ['DISCOUNT', 'CASHBACK', 'DISCOUNT_AND_CASHBACK'],
      required: true,
      default: 'DISCOUNT',
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount value must be 0 or more'],
    },
    cashback: {
      type: Number,
      default: 0,
      min: [0, 'Cashback value must be 0 or more'],
    },

    minimum_purchase: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD',
      },
    },

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
      default: 0.0,
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

// Validation logic for discount_type
couponSchema.pre('validate', function (next) {

   console.log('Validating coupon:', {
    discount_type: this.discount_type,
    discount: this.discount,
    cashback: this.cashback,
  });
  const { discount_type, discount, cashback } = this;

  if (discount_type === 'DISCOUNT') {
  if (discount <= 0) {
    return next(new Error('Discount must be greater than 0 for DISCOUNT type'));
  }
  if (cashback > 0) {
    return next(new Error('Cashback must be 0 for DISCOUNT type'));
  }
}

if (discount_type === 'CASHBACK') {
  if (cashback <= 0) {
    return next(new Error('Cashback must be greater than 0 for CASHBACK type'));
  }
  if (discount > 0) {
    return next(new Error('Discount must be 0 for CASHBACK type'));
  }
}

if (discount_type === 'DISCOUNT_AND_CASHBACK') {
  if (discount <= 0 || cashback <= 0) {
    return next(new Error('Both discount and cashback must be greater than 0 for DISCOUNT_AND_CASHBACK type'));
  }
}

next();
});

// Customize JSON output
couponSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: false });

  obj.discount = ['DISCOUNT', 'DISCOUNT_AND_CASHBACK'].includes(obj.discount_type) ? obj.discount : 0;
  obj.cashback = ['CASHBACK', 'DISCOUNT_AND_CASHBACK'].includes(obj.discount_type) ? obj.cashback : 0;

  // Remove internal fields
  // delete obj.discount;
  // delete obj.cashback;

  return obj;
};

// Indexes
couponSchema.index({ store: 1, code: 1 }, { unique: true });
couponSchema.index({ deleted_at: 1 });
couponSchema.index({ expiry_date: 1 });
couponSchema.index({ status: 1 });
couponSchema.index({ is_featured: 1 });
couponSchema.index({ popularity_score: -1 });
couponSchema.index({ 'verified_by.worked': 1 });

// Soft delete middleware
couponSchema.pre('find', function () {
  this.where({ deleted_at: null });
});
couponSchema.pre('findOne', function () {
  this.where({ deleted_at: null });
});

// Update status before save
couponSchema.pre('save', function (next) {
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

// Update Coupons Count in the Store of the new Coupon
couponSchema.post('save', async function (doc, next) {
  const Store = mongoose.model('Store');
  try {
    const store = await Store.findById(doc.store);
    if (store) {
      await store.updateCouponCounts();
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Instance Methods
couponSchema.methods.verify = async function (userId, worked) {
  this.verified_by.push({
    user: userId,
    verified_at: new Date(),
    worked,
  });

  const total = this.verified_by.length;
  const successful = this.verified_by.filter(v => v.worked).length;
  this.success_rate = (successful / total) * 100;

  return this.save();
};

couponSchema.methods.reportNotWorking = async function (userId, reason) {
  this.reported_not_working.push({
    user: userId,
    reported_at: new Date(),
    reason,
  });

  return this.save();
};

couponSchema.methods.updatePopularityScore = async function () {
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



