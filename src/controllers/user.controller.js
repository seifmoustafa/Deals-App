const User = require('../models/User.model');
const authService = require('../services/auth.service');
const admin = require('firebase-admin');


const controller = {
  async getAll(req, res) {
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
      const gender = req.query.gender;

    const filter = {
      $and: [
        {
          $or: [
            { full_name: searchRegex },
            { email: searchRegex },
            { phone: searchRegex },
            { country: searchRegex },
            { city: searchRegex },
          ],
        },
      ],
    };

      // Optional filter: active/inactive
    if (isActive === 'true' || isActive === 'false') {
      filter.$and.push({ is_active: isActive === 'true' });
    }

    // Optional filter: gender
    if (['male', 'female', 'other'].includes(gender)) {
      filter.$and.push({ gender });
    }

      const users = await User.find(filter).populate("interests", "title").sort(sort).skip(skip).limit(limit);
      const totalUsers = await User.countDocuments(filter);
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
      const { firebase_uid } = req.params;
      const user = await User.findOne({firebase_uid}).populate("interests", "title");
      //const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user.toPublicJSON());
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

async create(req, res) {
  const {
    full_name,
    email,
    phone,
    date_of_birth,
    gender,
    country,
    city,
    password,
    profile_image,
    interests, 
  } = req.body;

  try {
    // 1. Create user in Firebase Auth
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: full_name,
      ...(phone && /^\+?[1-9]\d{7,14}$/.test(phone) && { phoneNumber: phone.startsWith('+') ? phone : `+${phone}` }),
      //phoneNumber: phone ? `+${phone}` : undefined, // optional
    });

    const isCountrySet = !!country; 

    // 2. Save user in MongoDB
    const user = new User({
      full_name,
      email,
      phone,
      date_of_birth,
      gender,
      country,
      city,
      password, // Will be hashed via mongoose pre-save
      profile_image,
      firebase_uid: firebaseUser.uid,
      interests: Array.isArray(interests) && interests.length > 0 ? interests : null, // nullable
      isCountrySet,
    });

    const newUser = await user.save();
    res.status(201).json(newUser.toPublicJSON());
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ message: error.message });
  }
},


  // async create(req, res) {
  //   const user = new User({
  //     full_name: req.body.full_name,
  //     email: req.body.email,
  //     phone: req.body.phone,
  //     password: req.body.password, // Note: Should be hashed before saving
  //     profile_image: req.body.profile_image,
  //   });

  //   try {
  //     const newUser = await user.save();
  //     res.status(201).json(newUser.toPublicJSON());
  //   } catch (error) {
  //     res.status(400).json({ message: error.message });
  //   }
  // },

  async update(req, res) {
    try {
      const { firebase_uid } = req.params;
      const user = await User.findOne({firebase_uid});
     // const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      Object.keys(req.body).forEach((key) => {
         if (key === "interests") {
        // allow null or array
        user.interests =
          Array.isArray(req.body.interests) && req.body.interests.length > 0
            ? req.body.interests
            : null;
      } else if (key === "country") {
        user.country = req.body.country;
        user.isCountrySet = !!req.body.country;
      } else if (user[key] !== undefined) {
          user[key] = req.body[key];
        }
      });

      const updatedUser = await user.save();
      res.json(updatedUser.toPublicJSON());
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // To complete user profile data after registeration
   async updateAfterRegister(req, res) {
    try {
      const { firebase_uid } = req.params;
      const user = await User.findOne({firebase_uid});
     // const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      Object.keys(req.body).forEach((key) => {
         if (key === "interests") {
        // allow null or array
        user.interests =
          Array.isArray(req.body.interests) && req.body.interests.length > 0
            ? req.body.interests
            : null;
      } else if (key === "country") {
        user.country = req.body.country;
        user.isCountrySet = !!req.body.country;
      } else if (user[key] !== undefined) {
          user[key] = req.body[key];
        }
      });

      const updatedUser = await user.save();
      res.json(updatedUser.toPublicJSON());
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // For Update User from Dashboard
    async updateUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      console.log(id);
      console.log(user);
     // const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      Object.keys(req.body).forEach((key) => {
         if (key === "interests") {
        // allow null or array
        user.interests =
          Array.isArray(req.body.interests) && req.body.interests.length > 0
            ? req.body.interests
            : null;
      } else if (key === "country") {
        user.country = req.body.country;
        user.isCountrySet = !!req.body.country;
      } else if (user[key] !== undefined) {
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
    const { firebase_uid } = req.params;
    const user = await User.findOne({ firebase_uid });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user account from Firebase
    const result = await authService.deleteAccount(firebase_uid);

    // Delete user data from MongoDB
    await User.deleteOne({ firebase_uid });

    res.status(200).json({ message: 'User deleted successfully'});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  },

   deleteAllUsers: async (req, res) => {
     try {
    const users = await User.find({});
    for (const user of users) {
      await authService.deleteAccount(user.firebase_uid);
    }

     // Delete all user documents from MongoDB
    const result = await User.deleteMany({});
    
    res.status(200).json({ message: `🗑️ All users deleted`, deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

deleteSelectedUsers: async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds must be a non-empty array' });
    }

    // First delete accounts from external auth service
    const users = await User.find({ _id: { $in: userIds } });

    for (const user of users) {
      if (user.firebase_uid) {
        await authService.deleteAccount(user.firebase_uid);
      }
    }

    // Then delete from MongoDB
    const result = await User.deleteMany({ _id: { $in: userIds } });

    res.status(200).json({
      message: `🗑️ Selected users deleted`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},


inActivateAllUsers: async (req, res) => {
   try {
    const users = await User.find({});

    for (const user of users) {
      user.is_active = false;
      await user.save(); // ✅ Save each user instance
    }

    res.status(200).json({ message: `🔒 All users deactivated successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

inActivateSelectedUsers: async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds must be a non-empty array' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { is_active: false } }
    );

    res.status(200).json({
      message: `🔒 Selected users deactivated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

ActivateAllUsers: async (req, res) => {
  try {
    const users = await User.find({});

    for (const user of users) {
      user.is_active = true;
      await user.save(); // ✅ Save each user instance
    }

    res.status(200).json({ message: `🔒 All users activated successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},

ActivateSelectedUsers: async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds must be a non-empty array' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { is_active: true } }
    );

    res.status(200).json({
      message: `🔒 Selected users activated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
},


uploadProfileImage : async (req, res) => {
  try {
    // hybridAuth ممكن يكون جاب req.user أو req.admin — نأخذ أي واحد موجود
    const actor = req.user || req.admin;
    if (!actor) return res.status(401).json({ message: 'Unauthorized' });

    // multer-storage-cloudinary يحط الملف في req.file
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // req.file.path = URL, req.file.filename = public_id (مفيد لحذف القديم)
    const { path: url, filename: public_id } = req.file;

    // احصل على اليوزر من الداتا بيس عشان نحدث
    const user = await User.findById(actor._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // لو فيه صورة قديمة محفوظة عندك (public_id) احذفها من Cloudinary
    // نفترض إنك خزنت public_id في user.profile_image.path
    try {
      if (user.profile_image?.path) {
        // path هنا نفترضها public_id — لو خزنت URL بدل public_id, تحتاج تخزّن public_id من البداية
        await cloudinary.uploader.destroy(user.profile_image.path);
      }
    } catch (e) {
      console.warn('Failed to delete old image from Cloudinary', e.message);
      // ما نرمي الخطأ لو الحذف فشل، نكمل لنسجل الصورة الجديدة
    }

    // حدّث اليوزر بحقل الصورة الجديدة
    user.profile_image = {
      url,
      path: public_id, // public_id مهم للحذف لاحقاً
    };

    await user.save();

    // رد بيانات عامة (لو عندك toPublicJSON استخدمه)
    res.json({ success: true, profile_image: user.profile_image });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}




};

module.exports = controller;
