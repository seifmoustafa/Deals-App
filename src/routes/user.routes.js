const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');

router.get('/', controller.getAll);

router.get('/:firebase_uid', controller.getById);

router.post('/', controller.create);

router.patch('/:firebase_uid', controller.update);

router.delete('/:firebase_uid', controller.delete);

module.exports = router;
