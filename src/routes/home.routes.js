const express = require('express');
const router = express.Router();
const controller = require('../controllers/home.controller');
const hybridAuth = require('../middlewares/hybridAuth.middleware');


router.get('/mobile',hybridAuth, controller.mobile);

module.exports = router;
