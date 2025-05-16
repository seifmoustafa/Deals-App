const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');
const hybridAuth = require('../middlewares/hybridAuth.middleware');


router.get('/',hybridAuth, controller.getAll);

router.get('/:firebase_uid',hybridAuth, controller.getById);

router.post('/',hybridAuth, controller.create);

router.patch('/:firebase_uid',hybridAuth, controller.update);

router.patch('/updateAfterRegister/:firebase_uid', controller.updateAfterRegister);


router.delete('/:firebase_uid',hybridAuth, controller.delete);

module.exports = router;
