const User = require('../models/User.model');
const authService = require('../services/auth.service');

const controller = {
  async getAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const sortField = req.query.sortField || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const sort = { [sortField]: sortOrder };

      const users = await User.find().sort(sort).skip(skip).limit(limit);

      const totalUsers = await User.countDocuments();
      const totalPages = Math.ceil(totalUsers / limit);
      res.json({
        data: users.map((user) => user.toPublicJSON()),
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getById(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user.toPublicJSON());
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async create(req, res) {
    const user = new User({
      full_name: req.body.full_name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password, // Note: Should be hashed before saving
      profile_image: req.body.profile_image,
    });

    try {
      const newUser = await user.save();
      res.status(201).json(newUser.toPublicJSON());
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  async update(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      Object.keys(req.body).forEach((key) => {
        if (user[key] !== undefined) {
          user[key] = req.body[key];
        }
      });

      const updatedUser = await user.save();
      res.json(updatedUser.toPublicJSON());
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await authService.deleteAccount(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = controller;
