// src/models/storeModel.js
const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Store title is required'],
      trim: true,
    },
    sub_title: {
      type: String,
      trim: true,
    },
    image: {
      url: {
        type: String,
       // required: [true, 'Store image URL is required'],
      },
      path: String, // For Firebase Storage reference
    },
    store_url: {
      type: String,
      required: [true, 'Store URL is required'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StoreCategory',
      required: [true, 'Store category is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    countries: [
      {
        type: String,
        trim: true,
      },
    ],
    // cashback: {
    //   rate: {
    //     type: mongoose.Schema.Types.Double,
    //     default: 0.0,
    //   },
    //   terms: [String],
    // },
    average_savings: {
      type: mongoose.Schema.Types.Double,
      default: 0.0,
    },
    total_coupons: {
      type: Number,
      default: 0.0,
    },
    active_coupons: {
      type: Number,
      default: 0.0,
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    popularity_score: {
      type: mongoose.Schema.Types.Double,
      default: 0.0,
    },
    last_coupon_added: {
      type: Date,
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
storeSchema.index({ deleted_at: 1 });
storeSchema.index({ title: 'text', sub_title: 'text' }); // For text search
storeSchema.index({ category: 1 });
storeSchema.index({ is_featured: 1 });
storeSchema.index({ popularity_score: -1 });

// Middleware for soft deletes
storeSchema.pre('find', function () {
  this.where({ deleted_at: null });
});

storeSchema.pre('findOne', function () {
  this.where({ deleted_at: null });
});

// Virtual for coupons
storeSchema.virtual('coupons', {
  ref: 'Coupon',
  localField: '_id',
  foreignField: 'store',
});

// Static method for soft delete
storeSchema.statics.softDelete = async function (storeId) {
  return this.findByIdAndUpdate(storeId, {
    deleted_at: new Date(),
    is_active: false,
  });
};

// Method to update coupon counts
storeSchema.methods.updateCouponCounts = async function () {
  const Coupon = mongoose.model('Coupon');

  const [totalCount, activeCount] = await Promise.all([
    Coupon.countDocuments({ store: this._id, deleted_at: null }),
    Coupon.countDocuments({
      store: this._id,
      deleted_at: null,
      expiry_date: { $gt: new Date() },
    }),
  ]);

  this.total_coupons = totalCount;
  this.active_coupons = activeCount;
  return this.save();
};

// Method to calculate and update average savings
storeSchema.methods.updateAverageSavings = async function () {
  const Coupon = mongoose.model('Coupon');

  const result = await Coupon.aggregate([
    {
      $match: {
        store: this._id,
        deleted_at: null,
        savings_value: { $exists: true },
      },
    },
    {
      $group: {
        _id: null,
        averageSavings: { $avg: '$savings_value' },
      },
    },
  ]);

  if (result.length > 0) {
    this.average_savings = result[0].averageSavings;
    await this.save();
  }
};

 // const Store = mongoose.model('Store', storeSchema);
// module.exports = Store;

 const Store = mongoose.models.Store || mongoose.model('Store', storeSchema);
 module.exports = Store;


