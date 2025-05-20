const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');
const hybridAuth = require('../middlewares/hybridAuth.middleware');
const {
  authenticateAdmin,
  authorizeRole,
} = require('../middlewares/admin.middleware');



//#region Dashboard
router.patch('/inactivate-all',authenticateAdmin, authorizeRole(`super`,`regular`), controller.inActivateAllUsers);

router.patch('/inactivate-selectedUsers',authenticateAdmin, authorizeRole(`super`,`regular`), controller.inActivateSelectedUsers);

router.patch('/activate-all',authenticateAdmin, authorizeRole(`super`,`regular`), controller.ActivateAllUsers);

router.patch('/activate-selectedUsers',authenticateAdmin, authorizeRole(`super`,`regular`), controller.ActivateSelectedUsers);

router.delete('/delete-all',authenticateAdmin, authorizeRole(`super`,`regular`), controller.deleteAllUsers);

router.delete('/delete-selectedUsers',authenticateAdmin, authorizeRole(`super`,`regular`), controller.deleteSelectedUsers);

router.get('/', authenticateAdmin, authorizeRole(`super`,`regular`), controller.getAll);

router.post('/',authenticateAdmin,authorizeRole(`super`,`regular`), controller.create);

router.patch('/update-user/:id',authenticateAdmin, authorizeRole(`super`,`regular`), controller.updateUser);

//#endregion


//#region Mobile App
router.get('/:firebase_uid',hybridAuth, controller.getById);

router.patch('/:firebase_uid',hybridAuth, controller.update);

router.patch('/updateAfterRegister/:firebase_uid', controller.updateAfterRegister);

router.delete('/:firebase_uid',hybridAuth, controller.delete);

//#endregion













module.exports = router;
