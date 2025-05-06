const express = require('express');
const router = express.Router();
const controller = require('../controllers/coupon.controller');
const authenticateJwt = require('../middlewares/authorization.middleware');


router.get('/',authenticateJwt, controller.getAll);

router.get('/:id',authenticateJwt, controller.getSingle);

router.post('/',authenticateJwt, controller.create);

router.patch('/:id',authenticateJwt, controller.update);

router.delete('/:id',authenticateJwt, controller.delete);

module.exports = router;
