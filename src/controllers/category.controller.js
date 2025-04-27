const Category = require('../models/Category.model');

const controller = {
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const sortField = req.query.sortField || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const sort = { [sortField]: sortOrder };

      const categories = await Category.find()
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const totalCategories = await Category.countDocuments();
      const totalPages = Math.ceil(totalCategories / limit);
      res.json({
        data: categories,
        pagination: {
          currentPage: page,
          totalPages,
          totalCategories,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getSingle: async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  create: async (req, res) => {
    const category = new Category({
      title: req.body.title,
      description: req.body.description,
      icon: req.body.icon,
      color_code: req.body.color_code,
      order: req.body.order,
      is_featured: req.body.is_featured,
    });

    try {
      const newCategory = await category.save();
      res.status(201).json(newCategory);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      Object.keys(req.body).forEach((key) => {
        if (category[key] !== undefined) {
          category[key] = req.body[key];
        }
      });

      const updatedCategory = await category.save();
      res.json(updatedCategory);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      await category.remove();
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = controller;
