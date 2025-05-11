const express = require('express');
const router = express.Router();
const controller = require('../controllers/bookmark.controller');
const hybridAuth = require('../middlewares/hybridAuth.middleware');


router.get('/:firebase_uid',hybridAuth, controller.getAll);

router.post('/',hybridAuth, controller.create);

router.delete('/:id',hybridAuth, controller.delete);

module.exports = router;
