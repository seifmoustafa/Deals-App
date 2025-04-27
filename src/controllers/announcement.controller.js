const Announcement = require('../models/Announcement.model');

const controller = {
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const sortField = req.query.sortField || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const sort = { [sortField]: sortOrder };

      const announcements = await Announcement.find()
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      const totalAnnouncements = await Announcement.countDocuments();
      const totalPages = Math.ceil(totalAnnouncements / limit);
      res.json({
        data: announcements,
        pagination: {
          currentPage: page,
          totalPages,
          totalAnnouncements,
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
      const announcement = await Announcement.findById(req.params.id);
      if (!announcement) {
        return res.status(404).json({ message: 'Announcement not found' });
      }
      res.json(announcement);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  create: async (req, res) => {
    const announcement = new Announcement({
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
    });

    try {
      const newAnnouncement = await announcement.save();
      res.status(201).json(newAnnouncement);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const announcement = await Announcement.findById(req.params.id);
      if (!announcement) {
        return res.status(404).json({ message: 'Announcement not found' });
      }

      Object.keys(req.body).forEach((key) => {
        if (announcement[key] !== undefined) {
          announcement[key] = req.body[key];
        }
      });

      const updatedAnnouncement = await announcement.save();
      res.json(updatedAnnouncement);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await Announcement.softDelete(req.params.id);
      if (!result) {
        return res.status(404).json({ message: 'Announcement not found' });
      }

      res.json({ message: 'Announcement deleted' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = controller;
