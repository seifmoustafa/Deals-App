const express = require('express');
const router = express.Router();
const controller = require('../controllers/home.controller');
const authenticateJwt = require('../middlewares/authorization.middleware');


router.get('/mobile',authenticateJwt, controller.mobile);

module.exports = router;
