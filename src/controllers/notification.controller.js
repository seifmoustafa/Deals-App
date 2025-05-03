const User = require('../models/User.model');
const Notification = require('../models/Notification.model');
const admin = require('firebase-admin');
const Store = require('../models/Store.model');
const fcmService = require('../services/notification.service');


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

      //const user = await User.findByIdAndUpdate({ firebase_uid }, update, {new: true });
      const user = await User.findOneAndUpdate({ firebase_uid }, update, { new: true });
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

  sendNotification: async (req, res) => {
    try {
      const { firebase_uid, title, body } = req.body;
  
      const user = await User.findOne({ firebase_uid });
      if (!user || user.fcm_tokens.length === 0) {
        return res.status(404).json({ success: false, message: 'No tokens found' });
      }
  
      const message = {
        notification: {
          title,
          body,
        },
        tokens: user.fcm_tokens, // Can be a single token or an array
      };
  
      const response = await admin.messaging().sendMulticast(message);
  
      return res.status(200).json({
        success: true,
        message: 'Notification sent',
        response,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
},


sendStoreToFirebaseUids: async (req, res) => {
  try {
    const { firebaseUids, storeId } = req.body;

    if (!Array.isArray(firebaseUids) || !storeId) {
      return res.status(400).json({ success: false, message: 'firebaseUids (array) and storeId are required' });
    }

    console.log('🔥 Incoming request body:', req.body);

    const store = await Store.findById(storeId);
    console.log('🛒 Store fetched:', store);

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const notification = {
      title: store.title,
      body: `New offers available at ${store.title}!`,
    };

    console.log('📣 Notification content:', notification);


    const data = {
      storeId: storeId.toString(),
    };

    const result = await fcmService.sendToUsers(firebaseUids, notification, data, true);

    console.log('✅ FCM service result:', result);

    return res.status(200).json({
      success: true,
      store: {
        title: store.title,
        image: store.image?.url || null,
      },
      message: notification.body,
      ...result,
    });
  } catch (err) {
    console.error('Error sending to firebaseUids:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
},


sendStoreToAllUsers: async (req, res) => {
  try {
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({ success: false, message: 'storeId is required' });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const users = await User.find({ fcm_tokens: { $exists: true, $ne: [] } });
    const firebaseUids = users.map((u) => u.firebase_uid);

    const notification = {
      title: store.title,
      body: `New offers available at ${store.title}!`,
    };

    const data = {
      storeId: storeId.toString(),
    };

    const result = await fcmService.sendToUsers(firebaseUids, notification, data, true);

    return res.status(200).json({
      success: true,
      store: {
        title: store.title,
        image: store.image?.url || null,
      },
      message: notification.body,
      ...result,
    });
  } catch (err) {
    console.error('Error sending to all users:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
},

};


  
module.exports = controller;
