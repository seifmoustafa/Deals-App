const User = require('../models/User.model');
const Notification = require('../models/Notification.model');

const controller = {
  allow: async (req, res) => {
    try {
      const { firebase_uid, token } = req.body;

      if (!firebase_uid || !token) {
        return res
          .status(400)
          .json({ success: false, message: 'User ID and token are required' });
      }

      const user = await User.findOneAndUpdate(
        { firebase_uid: firebase_uid },
        { $addToSet: { fcm_tokens: token } },
        { new: true },
      );

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Notifications enabled successfully',
        tokensCount: user.fcm_tokens.length,
      });
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  prevent: async (req, res) => {
    try {
      const { firebase_uid, token } = req.body;

      if (!firebase_uid) {
        return res
          .status(400)
          .json({ success: false, message: 'User ID is required' });
      }

      let update;
      if (token) {
        update = { $pull: { fcm_tokens: token } };
      } else {
        update = { $set: { fcm_tokens: [] } };
      }

      const user = await User.findByIdAndUpdate({ firebase_uid }, update, {
        new: true,
      });

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        message: token
          ? 'Token removed successfully'
          : 'All notification tokens removed',
        tokensCount: user.fcm_tokens.length,
      });
    } catch (error) {
      console.error('Error disabling notifications:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  get: async (req, res) => {
    try {
      const { firebase_uid } = req.params;
      const { limit = 20, offset = 0, unreadOnly = false } = req.query;

      if (!firebase_uid) {
        return res
          .status(400)
          .json({ success: false, message: 'User ID is required' });
      }

      const query = { userId: firebase_uid };
      if (unreadOnly === 'true') {
        query.read = false;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit));

      const total = await Notification.countDocuments(query);

      return res.status(200).json({
        success: true,
        data: {
          notifications,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: total > parseInt(offset) + parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  read: async (req, res) => {
    try {
      const { firebase_uid, notificationIds } = req.body;

      if (!firebase_uid) {
        return res
          .status(400)
          .json({ success: false, message: 'User ID is required' });
      }

      let query = { firebase_uid };

      if (notificationIds && notificationIds.length > 0) {
        query._id = { $in: notificationIds };
      }

      const result = await Notification.updateMany(query, {
        $set: { read: true },
      });

      return res.status(200).json({
        success: true,
        message: 'Notifications marked as read',
        count: result.modifiedCount,
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },
};

module.exports = controller;
