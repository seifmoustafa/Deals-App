// src/models/categoryModel.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Category title is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      url: String,
      path: String, // For Firebase Storage reference
    },
    color_code: {
      type: String,
      default: '#000000', // For UI customization
    },
    order: {
      type: Number,
      default: 0, // For custom ordering in UI
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
    store_count: {
      type: Number,
      default: 0,
    },
    active_coupon_count: {
      type: Number,
      default: 0,
    },
    average_savings: {
      type: mongoose.Schema.Types.Double,
      default: 0.0,
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

// Indexes
categorySchema.index({ deleted_at: 1 });
categorySchema.index({ order: 1 });
categorySchema.index({ is_featured: 1 });
categorySchema.index({ store_count: -1 });

// Create slug from title
categorySchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Middleware for soft deletes
categorySchema.pre('find', function () {
  this.where({ deleted_at: null });
});

categorySchema.pre('findOne', function () {
  this.where({ deleted_at: null });
});

// Virtual for stores
categorySchema.virtual('stores', {
  ref: 'Store',
  localField: '_id',
  foreignField: 'category',
});

// Methods
categorySchema.statics.softDelete = async function (categoryId) {
  return this.findByIdAndUpdate(categoryId, {
    deleted_at: new Date(),
    is_active: false,
  });
};

// Update category statistics
categorySchema.methods.updateStats = async function () {
  const Store = mongoose.model('Store');
  const Coupon = mongoose.model('Coupon');

  const [storeCount, activeCoupons, savingsData] = await Promise.all([
    Store.countDocuments({ category: this._id, deleted_at: null }),
    Coupon.countDocuments({
      'store.category': this._id,
      status: 'ACTIVE',
      deleted_at: null,
    }),
    Coupon.aggregate([
      {
        $lookup: {
          from: 'stores',
          localField: 'store',
          foreignField: '_id',
          as: 'store',
        },
      },
      {
        $unwind: '$store',
      },
      {
        $match: {
          'store.category': this._id,
          deleted_at: null,
          average_savings: { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          averageSavings: { $avg: '$average_savings.amount' },
        },
      },
    ]),
  ]);

  this.store_count = storeCount;
  this.active_coupon_count = activeCoupons;
  this.average_savings = savingsData[0]?.averageSavings || 0;

  return this.save();
};

const Category = mongoose.model('StoreCategory', categorySchema);

module.exports = Category;
