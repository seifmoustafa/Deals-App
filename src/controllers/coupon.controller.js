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

    // Base match stage
    const baseMatch = {
      $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }]
    };

    // Optional filters
    const storeFilter = req.query.store && mongoose.Types.ObjectId.isValid(req.query.store)
      ? { store: new mongoose.Types.ObjectId(req.query.store) }
      : null;

    const categoryFilter = req.query.category && mongoose.Types.ObjectId.isValid(req.query.category)
      ? { 'store.category': new mongoose.Types.ObjectId(req.query.category) }
      : null;

    // Main pipeline
    const pipeline = [
      { $match: { ...baseMatch, ...(storeFilter || {}) } },
      {
        $lookup: {
          from: 'stores',
          localField: 'store',
          foreignField: '_id',
          as: 'store',
        },
      },
      { $unwind: { path: '$store', preserveNullAndEmptyArrays: true } },
      ...(categoryFilter ? [{ $match: categoryFilter }] : []),
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ];

    // Count pipeline (same as main pipeline but without skip/limit)
    const countPipeline = [
      { $match: { ...baseMatch, ...(storeFilter || {}) } },
      {
        $lookup: {
          from: 'stores',
          localField: 'store',
          foreignField: '_id',
          as: 'store',
        },
      },
      { $unwind: { path: '$store', preserveNullAndEmptyArrays: true } },
      ...(categoryFilter ? [{ $match: categoryFilter }] : []),
      { $count: 'total' }
    ];

    const [coupons, countResult] = await Promise.all([
      Coupon.aggregate(pipeline),
      Coupon.aggregate(countPipeline)
    ]);

    const totalCoupons = countResult[0]?.total || 0;
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
    console.error('Error in getAll:', error);
    res.status(500).json({ message: error.message });
  }
},

  // getAll: async (req, res) => {
  //   try {
  //     const page = parseInt(req.query.page) || 1;
  //     const limit = parseInt(req.query.limit) || 10;
  //     const skip = (page - 1) * limit;

  //     const sortField = req.query.sortField || 'createdAt';
  //     const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  //     const sort = { [sortField]: sortOrder };

  //     const pipeline = [
  //   {
  //   $match: {
  //     $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
  //   },
  // },
  // {
  //   $lookup: {
  //     from: 'stores',
  //     localField: 'store',
  //     foreignField: '_id',
  //     as: 'store',
  //   },
  // },
  // { $unwind: '$store' },
  // ...(req.query.store && mongoose.Types.ObjectId.isValid(req.query.store)
  //   ? [{
  //       $match: {
  //         'store._id': new mongoose.Types.ObjectId(req.query.store),
  //       },
  //     }]
  //   : []),
  // ...(req.query.category && mongoose.Types.ObjectId.isValid(req.query.category)
  //   ? [{
  //       $match: {
  //         'store.category': new mongoose.Types.ObjectId(req.query.category),
  //       },
  //     }]
  //   : []),
  // { $sort: sort },
  // { $skip: skip },
  // { $limit: limit },
  //       // {
  //       //   $project: {
  //       //     code: 1,
  //       //     'store._id': 1,
  //       //     'store.title': 1,
  //       //     'store.category': 1,
  //       //     title: 1,
  //       //     description: 1,
  //       //     terms_and_conditions: 1,
  //       //     valid_for: 1,
  //       //     discount_type: 1,
  //       //     discount_value: 1,
  //       //     start_date: 1,
  //       //     expiry_date: 1,
  //       //     createdAt: 1,
  //       //   },
  //       // },
  //     ];

  //     const coupons = await Coupon.aggregate(pipeline);

  //     const countPipeline = pipeline.slice(0, -3); // Remove skip, limit, and project
  //     countPipeline.push({ $count: 'total' });
  //     const totalResults = await Coupon.aggregate(countPipeline);
  //     const totalCoupons = totalResults[0]?.total || 0;
  //     const totalPages = Math.ceil(totalCoupons / limit);

  //     res.json({
  //       data: coupons,
  //       pagination: {
  //         currentPage: page,
  //         totalPages,
  //         totalCoupons,
  //         hasNextPage: page < totalPages,
  //         hasPrevPage: page > 1,
  //       },
  //     });
  //   } catch (error) {
  //     res.status(500).json({ message: error.message });
  //   }
  // },

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

  getCouponsByStoreId :  async (req, res) => {
  try {
    const { storeId } = req.params;
    const { pageNo = 1, pageSize = 10, status, search } = req.query;

    // Build base query
    const query = {
      store: storeId,
      deleted_at: null,
    };

    // Optional status filter
    if (status) {
      query.status = status.toUpperCase(); // Ensure match with enum like 'ACTIVE'
    }

    // Optional search by code or title (case-insensitive, partial)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ code: searchRegex }, { title: searchRegex }];
    }

    const skip = (parseInt(pageNo) - 1) * parseInt(pageSize);

    // Execute query
    const [coupons, totalItems] = await Promise.all([
      Coupon.find(query).skip(skip).limit(parseInt(pageSize)).sort({ createdAt: -1 }),
      Coupon.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: coupons,
      pageNo: parseInt(pageNo),
      pageSize: parseInt(pageSize),
      totalItems,
    });
  } catch (error) {
    console.error('Error fetching coupons by store:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
},

  create: async (req, res) => {
    const coupon = new Coupon({
      code: req.body.code,
      store: req.body.store,
      country: req.body.country,
      title: req.body.title,
      description: req.body.description,
      discount_type: req.body.discount_type,
      discount: req.body.discount,
      cashback : req.body.cashback,
      minimum_purchase: req.body.minimum_purchase,
      terms_and_conditions: req.body.terms_and_conditions,
      valid_for: req.body.valid_for,
      start_date: req.body.start_date,
      expiry_date: req.body.expiry_date,
      usage_limit: req.body.usage_limit,
    });

    try {
      const newCoupon = await coupon.save();
      // const users = await User.find();
      // const store = await Store.findById(req.body.store);

      // const ids = users.map((user) => user.firebase_uid);

      // const notification = {
      //   title: store.title,
      //   body: 'New coupons were added',
      // };

      // const data = {
      //   store: store.id,
      //   storeName: store.title,
      //   image: store.image?.url,
      //   coupon: newCoupon.id,
      // };

      // const saveToDB = true;

      // await notificationService.sendToUsers(ids, notification, data, saveToDB);
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
    const result = await Coupon.deleteOne({ _id: req.params.id });;
    if (!result) {
        return res.status(404).json({ message: 'Coupon not found' });
            }
    res.json({ message: 'Coupon deleted successfully' });
      // coupon.is_active = false;
      // coupon.status = 'DELETED';
      // const deletedCoupon = await coupon.save();
      // res.json(deletedCoupon);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },


//  getCouponsByUserCountry : async (req, res) => {
//   try {
//     const userCountry = req.user.country;

//     if (!userCountry) {
//       return res.status(400).json({ message: 'User country not set' });
//     }

//     const coupons = await Coupon.find({ country: userCountry })
//       .populate('store')
//       .lean();

//     res.json(coupons);
//   } catch (error) {
//     console.error('Error fetching coupons by country:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// }



getCouponsByUserCountry: async (req, res) => {
  try {
    const userCountry = req.user.country;
    if (!userCountry) {
      return res.status(400).json({ message: 'User country not set' });
    }

    // pagination params
    const pageNo = parseInt(req.query.pageNo) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (pageNo - 1) * pageSize;

    // search param
    const search = req.query.search?.trim();

    // base match (country filter always)
    let matchStage = { country: userCountry };

    const basePipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'stores',
          localField: 'store',
          foreignField: '_id',
          as: 'store',
        },
      },
      { $unwind: { path: '$store', preserveNullAndEmptyArrays: true } },
    ];

    // search filter
    if (search) {
      basePipeline.push({
        $match: {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { code: { $regex: search, $options: 'i' } },
            { 'store.title': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    // ----- count pipeline -----
    const countPipeline = [...basePipeline, { $count: 'count' }];
    const countResult = await Coupon.aggregate(countPipeline);
    const itemsCount = countResult[0]?.count || 0;

    // ----- data pipeline -----
    const dataPipeline = [
      ...basePipeline,
      { $sort: { createdAt: -1 } }, 
      { $skip: skip },
      { $limit: pageSize },
    ];

    const coupons = await Coupon.aggregate(dataPipeline);

    res.json({
      data: coupons,
      pagination: {
        pageNo,
        pageSize,
        itemsCount,
      //  totalPages: Math.ceil(itemsCount / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching coupons by country:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}



};

module.exports = controller;
