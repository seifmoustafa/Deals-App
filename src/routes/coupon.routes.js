const express = require('express');
const router = express.Router();
const controller = require('../controllers/coupon.controller');
const hybridAuth = require('../middlewares/hybridAuth.middleware');
const {
  authenticateAdmin,
  authorizeRole,
} = require('../middlewares/admin.middleware');


router.get('/',hybridAuth, controller.getAll);

router.get('/:id',hybridAuth, controller.getSingle);

router.get('/couponsByStore/:storeId',hybridAuth, controller.getCouponsByStoreId);

router.post('/',authenticateAdmin, authorizeRole(`super`,`regular`), controller.create);

router.patch('/:id',authenticateAdmin, authorizeRole(`super`,`regular`), controller.update);

router.delete('/:id',authenticateAdmin, authorizeRole(`super`,`regular`), controller.delete);

module.exports = router;
