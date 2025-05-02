const express = require('express');
const router = express.Router();
const controller = require('../controllers/notification.controller');

router.post('/allow', controller.allow);

router.post('/prevent', controller.prevent);

router.get('/:firebase_uid', controller.get);

router.patch('/read', controller.read);

router.post('/send', controller.sendNotification);

module.exports = router;
