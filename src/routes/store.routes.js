const express = require('express');
const router = express.Router();
const controller = require('../controllers/store.controller');
const Store = require('../models/Store.model');
const authenticateJwt = require('../middlewares/authorization.middleware');


router.get('/',authenticateJwt, controller.getAll);

router.get('/:id',authenticateJwt, controller.getSingle);

router.post('/',authenticateJwt, controller.create);

router.patch('/:id',authenticateJwt, controller.update);

router.delete('/:id',authenticateJwt, controller.delete);

module.exports = router;
