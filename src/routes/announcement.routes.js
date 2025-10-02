const express = require('express');
const router = express.Router();
const controller = require('../controllers/announcement.controller');
const hybridAuth = require('../middlewares/hybridAuth.middleware');
const uploadAnnouncement = require('../middlewares/uploadAnnouncement.middleware');
const {
  authenticateAdmin,
  authorizeRole,
} = require('../middlewares/admin.middleware');


router.get('/',hybridAuth, controller.getAll);

router.get('/:id',hybridAuth, controller.getSingle);

router.post('/',hybridAuth, controller.create);

router.patch('/:id',hybridAuth, controller.update);

router.delete('/:id',hybridAuth, controller.delete);

router.post(
  '/:announcementId/upload-image',
  uploadAnnouncement.single('image'),
  authenticateAdmin,
  authorizeRole(`super`,`regular`),
  controller.uploadImage
);

module.exports = router;
