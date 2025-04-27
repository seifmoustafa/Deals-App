const express = require('express');
const router = express.Router();
const controller = require('../controllers/bookmark.controller');

router.get('/:firebase_uid', controller.getAll);

router.post('/', controller.create);

router.delete('/:id', controller.delete);

module.exports = router;
