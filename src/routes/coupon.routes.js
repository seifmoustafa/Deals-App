const express = require('express');
const router = express.Router();
const controller = require('../controllers/coupon.controller');
const hybridAuth = require('../middlewares/hybridAuth.middleware');


router.get('/',hybridAuth, controller.getAll);

router.get('/:id',hybridAuth, controller.getSingle);

router.post('/',hybridAuth, controller.create);

router.patch('/:id',hybridAuth, controller.update);

router.delete('/:id',hybridAuth, controller.delete);

module.exports = router;
