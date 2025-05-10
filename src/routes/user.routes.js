const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');
const authenticateJwt = require('../middlewares/authorization.middleware');


router.get('/',authenticateJwt, controller.getAll);

router.get('/:firebase_uid',authenticateJwt, controller.getById);

router.post('/',authenticateJwt, controller.create);

//router.patch('/:firebase_uid',authenticateJwt, controller.update);
router.patch('/:firebase_uid', controller.update);


router.delete('/:firebase_uid',authenticateJwt, controller.delete);

module.exports = router;
