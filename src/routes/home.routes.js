const express = require('express');
const router = express.Router();
const controller = require('../controllers/home.controller');

router.get('/mobile', controller.mobile);

module.exports = router;
