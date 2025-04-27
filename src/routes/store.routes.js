const express = require('express');
const router = express.Router();
const controller = require('../controllers/store.controller');
const Store = require('../models/Store.model');

router.get('/', controller.getAll);

router.get('/:id', controller.getSingle);

router.post('/', controller.create);

router.patch('/:id', controller.update);

router.delete('/:id', controller.delete);

module.exports = router;
