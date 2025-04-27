const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin.controller');
const {
  authenticateAdmin,
  authorizeRole,
} = require('../middlewares/admin.middleware');

router.post('/register', controller.register);

router.post('/login', controller.login);

router.get('/', authenticateAdmin, authorizeRole('super'), controller.getAll);

router.patch(
  '/update-role',
  authenticateAdmin,
  authorizeRole('super'),
  controller.updateRole,
);

module.exports = router;
