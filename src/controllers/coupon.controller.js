const Coupon = require('../models/Coupon.model');
const queryBuilder = require('../utils/QueryBuilder');
const mongoose = require('mongoose');
const notificationService = require('../services/notification.service');
const User = require('../models/User.model');
const Store = require('../models/Store.model');

const controller = {
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const sortField = req.query.sortField || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const sort = { [sortField]: sortOrder };

      const pipeline = [
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
        ...(req.query.store
          ? [
              {
                $match: {
                  'store._id': new mongoose.Types.ObjectId(req.query.store),
                },
              },
            ]
          : []),
        ...(req.query.category
          ? [
              {
                $match: {
                  'store.category': new mongoose.Types.ObjectId(
                    req.query.category,
                  ),
                },
              },
            ]
          : []),
        {
          $match: queryBuilder.coupons(req.query),
        },
        {
          $sort: sort,
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        // {
        //   $project: {
        //     code: 1,
        //     'store._id': 1,
        //     'store.title': 1,
        //     'store.category': 1,
        //     title: 1,
        //     description: 1,
        //     terms_and_conditions: 1,
        //     valid_for: 1,
        //     discount_type: 1,
        //     discount_value: 1,
        //     start_date: 1,
        //     expiry_date: 1,
        //     createdAt: 1,
        //   },
        // },
      ];

      const coupons = await Coupon.aggregate(pipeline);

      const countPipeline = pipeline.slice(0, -3); // Remove skip, limit, and project
      countPipeline.push({ $count: 'total' });
      const totalResults = await Coupon.aggregate(countPipeline);
      const totalCoupons = totalResults[0]?.total || 0;
      const totalPages = Math.ceil(totalCoupons / limit);

      res.json({
        data: coupons,
        pagination: {
          currentPage: page,
          totalPages,
          totalCoupons,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getSingle: async (req, res) => {
    try {
      const coupon = await Coupon.findById(req.params.id).populate('store');
      if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
      }
      res.json(coupon);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  create: async (req, res) => {
    const coupon = new Coupon({
      code: req.body.code,
      store: req.body.store,
      title: req.body.title,
      description: req.body.description,
      discount_type: req.body.discount_type,
      discount_value: req.body.discount_value,
      minimum_purchase: req.body.minimum_purchase,
      terms_and_conditions: req.body.terms_and_conditions,
      valid_for: req.body.valid_for,
      start_date: req.body.start_date,
      expiry_date: req.body.expiry_date,
      usage_limit: req.body.usage_limit,
    });

    try {
      const newCoupon = await coupon.save();
      const users = await User.find();
      const store = await Store.findById(req.body.store);

      const ids = users.map((user) => user.firebase_uid);

      const notification = {
        title: store.title,
        body: 'New coupons were added',
      };

      const data = {
        store: store.id,
        storeName: store.title,
        image: store.image?.url,
        coupon: newCoupon.id,
      };

      const saveToDB = true;

      await notificationService.sendToUsers(ids, notification, data, saveToDB);
      res.status(201).json(newCoupon);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const coupon = await Coupon.findById(req.params.id);
      if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
      }

      Object.keys(req.body).forEach((key) => {
        if (coupon[key] !== undefined) {
          coupon[key] = req.body[key];
        }
      });

      const updatedCoupon = await coupon.save();
      res.json(updatedCoupon);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const coupon = await Coupon.findById(req.params.id);
      if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
      }

      coupon.is_active = false;
      const deletedCoupon = await coupon.save();
      res.json(deletedCoupon);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = controller;
