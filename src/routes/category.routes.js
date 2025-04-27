const express = require('express');
const router = express.Router();
const controller = require('../controllers/category.controller');

// Get all categories
router.get('/', controller.getAll);

// Get single category
router.get('/:id', controller.getSingle);

// Create category
router.post('/', controller.create);

// Update category
router.patch('/:id', controller.update);

// Delete category (soft delete)
router.delete('/:id', controller.delete);

module.exports = router;
