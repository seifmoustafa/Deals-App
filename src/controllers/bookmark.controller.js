const Bookmark = require('../models/Bookmark.model');
const User = require('../models/User.model');

const controller = {
  getAll: async (req, res) => {
    try {
      const { firebase_uid } = req.params;
      const bookmarks = await Bookmark.find({ firebase_uid }).populate('store');
      res.status(200).json(bookmarks);
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
