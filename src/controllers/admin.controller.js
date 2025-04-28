const Admin = require('../models/Admin.model');
const jwt = require('jsonwebtoken');

const controller = {
  register: async (req, res) => {
    try {
      const { full_name, email, password, role } = req.body;

      const admin = new Admin({ full_name, email, password, role });

      await admin.save();

      res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const admin = await Admin.findOne({ email }).select('+password');
      if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: admin._id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
      );

      res.json({ token, admin: admin.toPublicJSON() });
    } catch (error) {
      res.status(401).json({ message: 'Authentication failed' });
    }
  },

  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const sortField = req.query.sortField || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const sort = { [sortField]: sortOrder };

      const admins = await Admin.find()
        .sort(sort)
        .skip(skip)
        .limit(limit)
        //.lean();

      const totalAdmins = await Admin.countDocuments();
      const totalPages = Math.ceil(totalAdmins / limit);
      res.json({
        data: admins.map((admin) => admin.toPublicJSON()),
        pagination: {
          currentPage: page,
          totalPages,
          totalAdmins,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updateRole: async (req, res) => {
    try {
      const { id, role } = req.body;

      const admin = await Admin.findById(id);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      admin.role = role;
      await admin.save();

      res.json({ message: 'Role updated successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
};

module.exports = controller;
