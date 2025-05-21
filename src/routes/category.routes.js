const express = require('express');
const router = express.Router();
const controller = require('../controllers/category.controller');
const hybridAuth = require('../middlewares/hybridAuth.middleware');
const {
  authenticateAdmin,
  authorizeRole,
} = require('../middlewares/admin.middleware');


router.patch('/activate-category', authenticateAdmin, authorizeRole(`super`,`regular`), controller.activateCategory);

router.patch('/inactivate-category', authenticateAdmin, authorizeRole(`super`,`regular`), controller.inactivateCategory);

router.patch('/activate-selectedCategory',authenticateAdmin, authorizeRole(`super`,`regular`), controller.ActivateSelectedCategories);

router.patch('/inactivate-selectedCategory',authenticateAdmin, authorizeRole(`super`,`regular`), controller.inActivateSelectedCategories);

router.delete('/delete-selectedCategory', authenticateAdmin, authorizeRole(`super`,`regular`), controller.deleteSelectedCategories);


// Get all categories
router.get('/', hybridAuth ,controller.getAll);

// Get single category
router.get('/:id',hybridAuth, controller.getSingle);


// Create category
router.post('/',authenticateAdmin, authorizeRole(`super`,`regular`), controller.create);

// Update category
router.patch('/:id',authenticateAdmin, authorizeRole(`super`,`regular`), controller.update);

// Delete category (soft delete)
router.delete('/:id',authenticateAdmin, authorizeRole(`super`,`regular`), controller.delete);



module.exports = router;
