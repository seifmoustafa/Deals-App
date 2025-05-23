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

      const search = req.query.search || '';
      const searchRegex = new RegExp(search, 'i');

      const isActive = req.query.is_active;
      const isFeatured = req.query.is_featured;


    const filter = {
      $and: [
        {
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { slug: searchRegex },
          ],
        },
      ],
    };

       // Optional filter: active/inactive
    if (isActive === 'true' || isActive === 'false') {
      filter.$and.push({ is_active: isActive === 'true' });
    }

    if (isFeatured === 'true' || isFeatured === 'false') {
      filter.$and.push({ is_featured: isFeatured === 'true' });
    }

      const categories = await Category.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

        await Promise.all(categories.map((cat) => cat.updateStats()));

      const refreshedCategories = await Category.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

      const totalCategories = await Category.countDocuments(filter);
      const totalPages = Math.ceil(totalCategories / limit);
      res.json({
        data: refreshedCategories,
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

      await category.deleteOne();
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteSelectedCategories: async (req, res) => {
    try {
      const { categoryIds } = req.body;
  
      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return res.status(400).json({ message: 'categoryIds must be a non-empty array' });
      }
    
      // Then delete from MongoDB
      const result = await Category.deleteMany({ _id: { $in: categoryIds } });
  
      res.status(200).json({
        message: `🗑️ Selected Categories deleted`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

     activateCategory: async (req, res) => {
      try {
        const { id } = req.query;
        console.log(req.query);
  
        const category = await Category.findById(id);
        if (!category) {
          return res.status(404).json({ message: 'category not found' });
        }
  
        category.is_active = true;
        await category.save();
  
        res.json({ message: 'Category Activated successfully' });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    },

  ActivateSelectedCategories: async (req, res) => {
  try {
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ message: 'categoryIds must be a non-empty array' });
    }

    const result = await Category.updateMany(
      { _id: { $in: categoryIds } },
      { $set: { is_active: true } }
    );

    res.status(200).json({
      message: `🔒 Selected Categories activated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

  inactivateCategory: async (req, res) => {
      try {
        const { id } = req.query;
        console.log(req.query);
  
        const category = await Category.findById(id);
        if (!category) {
          return res.status(404).json({ message: 'category not found' });
        }
  
        category.is_active = false;
        await category.save();
  
        res.json({ message: 'Category deactivated  successfully' });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    },

  inActivateSelectedCategories: async (req, res) => {
  try {
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ message: 'categoryIds must be a non-empty array' });
    }

    const result = await Category.updateMany(
      { _id: { $in: categoryIds } },
      { $set: { is_active: false } }
    );

    res.status(200).json({
      message: `🔒 Selected Categories deactivated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},


};

module.exports = controller;
