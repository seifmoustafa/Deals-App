const express = require('express');
const router = express.Router();
const controller = require('../controllers/bookmark.controller');
const authenticateJwt = require('../middlewares/authorization.middleware');


router.get('/:firebase_uid',authenticateJwt, controller.getAll);

router.post('/',authenticateJwt, controller.create);

router.delete('/:id',authenticateJwt, controller.delete);

module.exports = router;
