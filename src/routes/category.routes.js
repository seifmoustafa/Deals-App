const express = require('express');
const router = express.Router();
const controller = require('../controllers/category.controller');
const authenticateJwt = require('../middlewares/authorization.middleware');


// Get all categories
router.get('/', authenticateJwt ,controller.getAll);

// Get single category
//router.get('/:id', controller.getSingle);
router.get('/:id',authenticateJwt, controller.getSingle);


// Create category
router.post('/',authenticateJwt, controller.create);

// Update category
router.patch('/:id',authenticateJwt, controller.update);

// Delete category (soft delete)
router.delete('/:id',authenticateJwt, controller.delete);

module.exports = router;
