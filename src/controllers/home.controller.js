const Announcement = require('../models/Announcement.model');
const Store = require('../models/Store.model');
const Coupon = require('../models/Coupon.model');

const controller = {
  mobile: async (req, res) => {
    try {
      const { announcementsCount, storesCount, couponsCount } = req.query;
      const announcements = await Announcement.find().limit(
        announcementsCount || 5,
      );
      const stores = await Store.find().limit(storesCount || 5);
      const couponPipeline = [
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
          $limit: parseInt(couponsCount) || 5,
        },
        {
          $project: {
            code: 1,
            'store._id': 1,
            'store.title': 1,
            'store.image': 1,
            title: 1,
            description: 1,
            discount_type: 1,
            discount_value: 1,
            start_date: 1,
            expiry_date: 1,
            valid_for: 1,
            createdAt: 1,
          },
        },
      ];
      const coupons = await Coupon.aggregate(couponPipeline);
      res.json({ announcements, stores, coupons });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = controller;
