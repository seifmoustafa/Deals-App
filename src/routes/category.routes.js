const express = require('express');
const router = express.Router();
const controller = require('../controllers/category.controller');
const hybridAuth = require('../middlewares/hybridAuth.middleware');
const authorizeAdminOnly = require('../middlewares/authorizeAdminOnly.middleware');




// Get all categories
//router.get('/', authenticateJwt ,controller.getAll);
router.get('/', hybridAuth ,controller.getAll);

// Get single category
//router.get('/:id', controller.getSingle);
router.get('/:id',hybridAuth, controller.getSingle);


// Create category
router.post('/',hybridAuth, controller.create);

// Update category
router.patch('/:id',hybridAuth, controller.update);

// Delete category (soft delete)
router.delete('/:id',hybridAuth, controller.delete);

module.exports = router;
