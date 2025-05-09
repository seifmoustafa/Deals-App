const Bookmark = require('../models/Bookmark.model');
const User = require('../models/User.model');
const mongoose = require('mongoose');


const controller = {
getAll: async (req, res) => {
  try {
    const { firebase_uid } = req.params;
    const {
      PageNumber = 1,
      PageSize = 10,
      categories,
      hasCoupons,
      hasCashback,
      sortOrder = 'asc',
    } = req.query;

    const skip = (parseInt(PageNumber) - 1) * parseInt(PageSize);
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    // Parse categories
    const categoryArray = categories ? categories.split(',') : [];

    // Build dynamic store match filter (without deleted_at!)
    const storeMatch = {};

    if (categoryArray.length > 0) {
      storeMatch['store.category'] = {
        $in: categoryArray.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }

    if (hasCoupons === 'true') {
      storeMatch['store.total_coupons'] = { $gt: 0 };
    }

    if (hasCashback === 'true') {
      storeMatch['store.cashback.rate'] = { $gt: 0 };
    }

    // Aggregation
    const bookmarks = await Bookmark.aggregate([
      { $match: { firebase_uid } },
      {
        $lookup: {
          from: 'stores',
          localField: 'store',
          foreignField: '_id',
          as: 'store',
        },
      },
      { $unwind: '$store' },
      {
        $match: {
          'store.deleted_at': null,
          ...storeMatch,
        },
      },
      {
        $project: {
          firebase_uid: 1,
          store: {
            _id: 1,
            title: 1,
            image: 1,
            total_coupons: 1,
            cashback: {
              rate: { $ifNull: ['$store.cashback.rate', 0] },
            },
          },
        },
      },
      { $sort: { 'store.title': sortDirection } },
      { $skip: skip },
      { $limit: parseInt(PageSize) },
    ]);

    // Count total matching
    const total = await Bookmark.aggregate([
      { $match: { firebase_uid } },
      {
        $lookup: {
          from: 'stores',
          localField: 'store',
          foreignField: '_id',
          as: 'store',
        },
      },
      { $unwind: '$store' },
      {
        $match: {
          'store.deleted_at': null,
          ...storeMatch,
        },
      },
      { $count: 'total' },
    ]);
    const totalCount = total.length > 0 ? total[0].total : 0;
    console.log(bookmarks);
    res.status(200).json({
      data: bookmarks,
      pagination: {
        PageNumber: parseInt(PageNumber),
        PageSize: parseInt(PageSize),
        ItemsCount: totalCount,
        totalPages: Math.ceil(totalCount / PageSize),
      },
    });
  } catch (error) {
    console.error('Error while getting bookmarks:', error);
    res.status(500).json({
      message: 'Error while getting the bookmarks',
      error,
    });
  }
},


  // getAll: async (req, res) => {
  //   try {
  //     const { firebase_uid } = req.params;
  //     const { PageNumber = 1, PageSize = 10 } = req.query;
  //     const skip = (parseInt(PageNumber) - 1) * parseInt(PageSize);
  //     const bookmarks = await Bookmark.find({ firebase_uid }).populate('store' , 'title image total_coupons cashback')
  //     .skip(skip)
  //     .limit(parseInt(PageSize))
  //     .lean();
  //     const total = await Bookmark.countDocuments({ firebase_uid });

  //     const transformedBookmarks = bookmarks.map((bookmark) => ({
  //       ...bookmark,
  //       store: {
  //         ...bookmark.store,
  //         cashback: {
  //           rate: bookmark.store?.cashback?.rate ?? 0, // safely get cashback rate
  //         },
  //       },
  //     }));
  //     res.status(200).json({
  //       data: transformedBookmarks,
  //       pagination: {
  //         PageNumber: parseInt(PageNumber),
  //         PageSize: parseInt(PageSize),
  //         ItemsCount : total,
  //         totalPages: Math.ceil(total / PageSize),
  //       },
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       message: 'Error while getting the bookmarks',
  //       error,
  //     });
  //   }
  // },

  create: async (req, res) => {
  try {
    const { firebase_uid, storeId } = req.body;

    // Find user by Firebase UID
    const user = await User.findOne({ firebase_uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = user._id;

    // Check if the bookmark already exists
    const existingBookmark = await Bookmark.findOne({
      firebase_uid,
      store: storeId,
    });

    if (existingBookmark) {
      return res.status(400).json({
        message: 'Bookmark already exists for this store and user',
        bookmark: existingBookmark,
      });
    }

    // Create new bookmark
    const bookmark = await Bookmark.create({
      user: userId,
      firebase_uid,
      store: storeId,
    });

    res.status(201).json(bookmark);
  } catch (error) {
    res.status(500).json({
      message: 'Error while creating the bookmark',
      error,
    });
  }
},


  // create: async (req, res) => {
  //   try {
  //     const { firebase_uid, storeId } = req.body;
  //     const user = await User.findOne({ firebase_uid });
  //     const userId = user._id;
  //     const bookmark = await Bookmark.create({
  //       user: userId,
  //       firebase_uid,
  //       store: storeId,
  //     });
  //     res.status(201).json(bookmark);
  //   } catch (error) {
  //     res.status(500).json({
  //       message: 'Error while creating the bookmark',
  //       error,
  //     });
  //   }
  // },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedBookmark = await Bookmark.findByIdAndDelete(id);
      res.status(204).json(deletedBookmark);
    } catch (error) {
      res.status(500).json({
        message: 'Error while deleting the bookmark',
        error,
      });
    }
  },
};

module.exports = controller;
