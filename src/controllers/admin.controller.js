const Admin = require('../models/Admin.model');
const jwt = require('jsonwebtoken');

const controller = {
  register: async (req, res) => {
    try {
      const { full_name,username, email, password, role } = req.body;

      const admin = new Admin({ full_name, username, email, password, role });

      await admin.save();

      res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  login: async (req, res) => {
    try {
     // const { email, password } = req.body;
     const { username, password } = req.body;


     // const admin = await Admin.findOne({ email }).select('+password');
      const admin = await Admin.findOne({ username }).select('+password');
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

      const search = req.query.search || '';
      const searchRegex = new RegExp(search, 'i');

      const isActive = req.query.is_active;

      const filter = {
      $and: [
        {
          $or: [
        { full_name: searchRegex },
        { email: searchRegex },
        { username: searchRegex },
       ],
        },
      ],
    };

     // Optional filter: active/inactive
    if (isActive === 'true' || isActive === 'false') {
      filter.$and.push({ is_active: isActive === 'true' });
    }


      const admins = await Admin.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

      //const totalAdmins = await Admin.countDocuments();
       const totalAdmins = await Admin.countDocuments(filter);
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

 updateAdmin : async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent certain fields from being updated directly
    const forbiddenFields = ['password', '_id', 'createdAt', 'updatedAt', 'deleted_at'];
    forbiddenFields.forEach(field => delete updates[field]);

    const admin = await Admin.findById(id);
    if (!admin || admin.deleted_at) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Update allowed fields
    Object.keys(updates).forEach(key => {
      admin[key] = updates[key];
    });

    await admin.save();
    res.json({ message: 'Admin updated successfully', admin: admin.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

  updateRole: async (req, res) => {
    try {
      const { id, role } = req.body;
      console.log(req.body);

      const admin = await Admin.findById(id);
      console.log(admin);
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

   activateAdmin: async (req, res) => {
    try {
      const { id } = req.query;
      console.log(req.query);

      const admin = await Admin.findById(id);
      console.log(admin);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      admin.is_active = true;
      await admin.save();

      res.json({ message: 'Admin Activated successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  ActivateSelectedAdmins: async (req, res) => {
    try {
      const { adminIds } = req.body;
  
      if (!Array.isArray(adminIds) || adminIds.length === 0) {
        return res.status(400).json({ message: 'adminIds must be a non-empty array' });
      }
  
      const result = await Admin.updateMany(
        { _id: { $in: adminIds } },
        { $set: { is_active: true } }
      );
  
      res.status(200).json({
        message: `🔒 Selected Admins activated successfully`,
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },


    inActivateAdmin: async (req, res) => {
    try {
      const { id } = req.query;
      console.log(req.query);

      const admin = await Admin.findById(id);
      console.log(admin);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      admin.is_active = false;
      await admin.save();

      res.json({ message: 'Admin InActivated successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

    inActivateSelectedAdmins: async (req, res) => {
    try {
      const { adminIds } = req.body;
  
      if (!Array.isArray(adminIds) || adminIds.length === 0) {
        return res.status(400).json({ message: 'adminIds must be a non-empty array' });
      }
  
      const result = await Admin.updateMany(
        { _id: { $in: adminIds } },
        { $set: { is_active: false } }
      );
  
      res.status(200).json({
        message: `🔒 Selected Admins deactivated successfully`,
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

    deleteAdmin: async (req, res) => {
    try {
      const { id } = req.query;
      console.log(req.query);

      const admin = await Admin.findById(id);
      console.log(admin);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      await admin.deleteOne();
      res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  deleteSelectedAdmins: async (req, res) => {
    try {
      const { adminIds } = req.body;
  
      if (!Array.isArray(adminIds) || adminIds.length === 0) {
        return res.status(400).json({ message: 'adminIds must be a non-empty array' });
      }
  
      // First delete accounts from external auth service
      const admins = await Admin.find({ _id: { $in: adminIds } });
  
  
      // Then delete from MongoDB
      const result = await Admin.deleteMany({ _id: { $in: adminIds } });
  
      res.status(200).json({
        message: `🗑️ Selected admins deleted`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

   changeEmail: async (req, res) => {
    try {
      const { id , currentPassword , newEmail } = req.body;
      console.log(req.body);

      const admin = await Admin.findById(id).select('+password');;
      console.log(admin);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

       const isPasswordValid = await admin.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      admin.email = newEmail;
      await admin.save();
      res.json({ message: 'Email changed successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

   changePassword: async (req, res) => {
    try {
      const { id , currentPassword , newPassword } = req.body;
      console.log(req.body);

      const admin = await Admin.findById(id).select('+password');;
      console.log(admin);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

       const isPasswordValid = await admin.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      admin.password = newPassword;
      await admin.save();
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },


};

module.exports = controller;
