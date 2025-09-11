const express = require('express');
const router = express.Router();
const controller = require('../controllers/store.controller');
const Store = require('../models/Store.model');
const hybridAuth = require('../middlewares/hybridAuth.middleware');
const {
  authenticateAdmin,
  authorizeRole,
} = require('../middlewares/admin.middleware');


router.patch('/activate-store', authenticateAdmin, authorizeRole(`super`,`regular`), controller.activateStore);

router.patch('/inactivate-store', authenticateAdmin, authorizeRole(`super`,`regular`), controller.inactivateStore);

router.patch('/activate-selectedStore',authenticateAdmin, authorizeRole(`super`,`regular`), controller.ActivateSelectedStores);

router.patch('/inactivate-selectedStore',authenticateAdmin, authorizeRole(`super`,`regular`), controller.inActivateSelectedStores);

router.delete('/delete-selectedStore', authenticateAdmin, authorizeRole(`super`,`regular`), controller.deleteSelectedStores);




router.get('/',hybridAuth, controller.getAll);

router.get('/search' , hybridAuth , controller.search);

router.get('/stores-bycategoryId/:categoryId',hybridAuth, controller.getStoresByCategoryId);

router.get('/:id',hybridAuth, controller.getSingle);

router.post('/',authenticateAdmin, authorizeRole(`super`,`regular`), controller.create);

router.patch('/:id',authenticateAdmin, authorizeRole(`super`,`regular`), controller.update);

router.delete('/:id',authenticateAdmin, authorizeRole(`super`,`regular`), controller.delete);

module.exports = router;
