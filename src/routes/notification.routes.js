const express = require('express');
const router = express.Router();
const controller = require('../controllers/notification.controller');
const authenticateJwt = require('../middlewares/authorization.middleware');


router.post('/allow',authenticateJwt, controller.allow);

router.post('/prevent',authenticateJwt, controller.prevent);

router.get('/:firebase_uid',authenticateJwt, controller.get);

router.patch('/read',authenticateJwt, controller.read);

router.post('/send',authenticateJwt, controller.sendNotification);

router.post('/send-store-to-users',authenticateJwt, controller.sendStoreToFirebaseUids);

router.post('/send-store-to-all',authenticateJwt, controller.sendStoreToAllUsers);

router.post('/send-coupon-to-users',authenticateJwt, controller.sendCouponToFirebaseUids);

router.post('/send-coupon-to-all',authenticateJwt, controller.sendCouponToAllUsers);

module.exports = router;
