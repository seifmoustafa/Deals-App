const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin.controller');
const {
  authenticateAdmin,
  authorizeRole,
} = require('../middlewares/admin.middleware');

router.post('/register',authenticateAdmin, authorizeRole('super'), controller.register);

router.post('/login', controller.login);

router.get('/', authenticateAdmin, authorizeRole('super'), controller.getAll);

router.patch('/activate-admin', authenticateAdmin, authorizeRole('super'), controller.activateAdmin);

router.patch('/inactivate-admin', authenticateAdmin, authorizeRole('super'), controller.inActivateAdmin);

router.delete('/delete-admin', authenticateAdmin, authorizeRole('super'), controller.deleteAdmin);

router.patch('/change-email', authenticateAdmin, controller.changeEmail);

router.patch('/change-password', authenticateAdmin, controller.changePassword);



router.patch(
  '/update-role',
  authenticateAdmin,
  authorizeRole('super'),
  controller.updateRole,
);

module.exports = router;
