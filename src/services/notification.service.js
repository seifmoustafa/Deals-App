const express = require('express');
const admin = require('../config/firebase');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');

const fcmService = {
  /**
   * Send notification to a single user
   * @param {string} userId - ID of the user to send notification to
   * @param {object} notification - Contains title and body
   * @param {object} data - Additional data to send with notification
   * @param {boolean} saveToDb - Whether to save the notification to database
   * @returns {Promise<object>} - Result of send operation
   */
  sendToUser: async (userId, notification, data = {}, saveToDb = true) => {
    try {
      const user = await User.findOne({ firebase_uid: userId });
      if (!user || !user.fcm_tokens || user.fcm_tokens.length === 0) {
        throw new Error('User not found or has no registered devices');
      }

      const tokens = user.fcm_tokens;
      let successCount = 0;
      let failureCount = 0;
      const failedTokens = [];

      // Send to each token individually
      for (const token of tokens) {
        const message = {
          notification: {
            title: notification.title,
            body: notification.body,
          },
          token: token, // Note: single token instead of tokens array
        };

        try {
          await admin.messaging().send(message);
          successCount++;
        } catch (error) {
          failureCount++;
          failedTokens.push(token);
          console.log(`Failed to send to token: ${token}`, error.message);
        }
      }

      // Save notification to database if requested
      if (saveToDb) {
        const newNotification = new Notification({
          userId: userId,
          title: notification.title,
          body: notification.body,
          data: data,
        });
        await newNotification.save();
      }

      // Remove failed tokens from user
      if (failedTokens.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { fcm_tokens: { $in: failedTokens } },
        });
      }

      return {
        success: true,
        successCount: successCount,
        failureCount: failureCount,
      };
    } catch (error) {
      console.error('FCM send error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Send notification to multiple users
   * @param {Array<string>} userIds - Array of user IDs
   * @param {object} notification - Contains title and body
   * @param {object} data - Additional data to send with notification
   * @param {boolean} saveToDb - Whether to save notifications to database
   * @returns {Promise<object>} - Result of send operation
   */
  sendToUsers: async (userIds, notification, data = {}, saveToDb = true) => {
    try {
      const users = await User.find({ firebase_uid: { $in: userIds } });

      let successCount = 0;
      let failureCount = 0;
      const failureMap = {};

      // Process each user
      for (const user of users) {
        if (!user.fcm_tokens || user.fcm_tokens.length === 0) {
          continue;
        }

        const userId = user._id.toString();

        // Process each token for the current user
        for (const token of user.fcm_tokens) {
          const message = {
            notification: {
              title: notification.title,
              body: notification.body,
            },
            token: token, // Send to individual token
          };

          try {
            await admin.messaging().send(message);
            successCount++;
          } catch (error) {
            failureCount++;
            if (!failureMap[userId]) failureMap[userId] = [];
            failureMap[userId].push(token);
            console.log(`Failed to send to token: ${token}`, error.message);
          }
        }
      }

      // Save notifications to database if requested
      if (saveToDb) {
        const notifications = userIds.map((userId) => ({
          userId,
          title: notification.title,
          body: notification.body,
          data: data,
        }));

        await Notification.insertMany(notifications);
      }

      // Remove failed tokens from users
      const updatePromises = Object.entries(failureMap).map(
        ([userId, tokens]) => {
          return User.findByIdAndUpdate(userId, {
            $pull: { fcm_tokens: { $in: tokens } },
          });
        },
      );

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      return {
        success: true,
        successCount: successCount,
        failureCount: failureCount,
      };
    } catch (error) {
      console.error('FCM bulk send error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

module.exports = fcmService;
