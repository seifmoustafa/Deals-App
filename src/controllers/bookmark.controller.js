const Bookmark = require('../models/Bookmark.model');
const User = require('../models/User.model');

const controller = {
  getAll: async (req, res) => {
    try {
      const { firebase_uid } = req.params;
      const { PageNumber = 1, PageSize = 10 } = req.query;
      const skip = (parseInt(PageNumber) - 1) * parseInt(PageSize);
      const bookmarks = await Bookmark.find({ firebase_uid }).populate('store' , 'title image total_coupons cashback')
      .skip(skip)
      .limit(parseInt(PageSize))
      .lean();
      const total = await Bookmark.countDocuments({ firebase_uid });

      const transformedBookmarks = bookmarks.map((bookmark) => ({
        ...bookmark,
        store: {
          ...bookmark.store,
          cashback: {
            rate: bookmark.store?.cashback?.rate ?? 0, // safely get cashback rate
          },
        },
      }));
      res.status(200).json({
        data: transformedBookmarks,
        pagination: {
          PageNumber: parseInt(PageNumber),
          PageSize: parseInt(PageSize),
          ItemsCount : total,
          totalPages: Math.ceil(total / PageSize),
        },
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error while getting the bookmarks',
        error,
      });
    }
  },

  create: async (req, res) => {
    try {
      const { firebase_uid, storeId } = req.body;
      const user = await User.findOne({ firebase_uid });
      const userId = user._id;
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
