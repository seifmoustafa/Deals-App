const express = require('express');
const router = express.Router();
const controller = require('../controllers/notification.controller');
const hybridAuth = require('../middlewares/hybridAuth.middleware');


router.post('/allow',hybridAuth, controller.allow);

router.post('/prevent',hybridAuth, controller.prevent);

router.get('/:firebase_uid',hybridAuth, controller.get);

router.patch('/read',hybridAuth, controller.read);

router.post('/send',hybridAuth, controller.sendNotification);

router.post('/send-store-to-users',hybridAuth, controller.sendStoreToFirebaseUids);

router.post('/send-store-to-all',hybridAuth, controller.sendStoreToAllUsers);

router.post('/send-coupon-to-users',hybridAuth, controller.sendCouponToFirebaseUids);

router.post('/send-coupon-to-all',hybridAuth, controller.sendCouponToAllUsers);

module.exports = router;
