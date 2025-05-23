const Store = require('../models/Store.model');
const queryBuilder = require('../utils/QueryBuilder');

const controller = {
  getAll: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const sortField = req.query.sortField || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const sort = { [sortField]: sortOrder };

      const query = queryBuilder.stores(req.query);

      const stores = await Store.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('category')
        .lean();

      const totalStores = await Store.countDocuments(query);
      const totalPages = Math.ceil(totalStores / limit);
      res.json({
        data: stores,
        pagination: {
          currentPage: page,
          totalPages,
          totalStores,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },


  getStoresByCategoryId : async (req, res) => {
  try {
    const { categoryId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortField = req.query.sortField || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const isActive = req.query.is_active;
    const isFeatured = req.query.is_featured;

    const filter = {
      category: categoryId,
      deleted_at: null,
    };

    if (isActive === 'true' || isActive === 'false') {
      filter.is_active = isActive === 'true';
    }

    if (isFeatured === 'true' || isFeatured === 'false') {
      filter.is_featured = isFeatured === 'true';
    }

    const stores = await Store.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('category', 'title slug');

    const totalStores = await Store.countDocuments(filter);
    const totalPages = Math.ceil(totalStores / limit);

    res.json({
      data: stores,
      pagination: {
        currentPage: page,
        totalPages,
        totalStores,
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
      const store = await Store.findById(req.params.id).populate('category');
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }
      res.json(store);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  create: async (req, res) => {
    const store = new Store({
      title: req.body.title,
      sub_title: req.body.sub_title,
      image: req.body.image,
      store_url: req.body.store_url,
      category: req.body.category,
      description: req.body.description,
      is_featured: req.body.is_featured,
    });

    try {
      const newStore = await store.save();
      res.status(201).json(newStore);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const store = await Store.findById(req.params.id);
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }

      Object.keys(req.body).forEach((key) => {
        if (store[key] !== undefined) {
          store[key] = req.body[key];
        }
      });

      const updatedStore = await store.save();
      res.json(updatedStore);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  delete: async (req, res) => {
    const { id } = req.params.id;
    try {
      const result = await Store.deleteOne(id);
      if (!result) {
        return res.status(404).json({ message: 'Store not found' });
      }
      res.json({ message: 'Store deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

    deleteSelectedStores: async (req, res) => {
     try {
      const { storeIds } = req.body;
  
      if (!Array.isArray(storeIds) || storeIds.length === 0) {
        return res.status(400).json({ message: 'storeIds must be a non-empty array' });
      }
    
      // Then delete from MongoDB
      const result = await Store.deleteMany({ _id: { $in: storeIds } });
  
      res.status(200).json({
        message: `🗑️ Selected Stores deleted`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },


activateStore: async (req, res) => {
        try {
          const { id } = req.query;
          console.log(req.query);
    
          const store = await Store.findById(id);
          if (!store) {
            return res.status(404).json({ message: 'store not found' });
          }
    
          store.is_active = true;
          await store.save();
    
          res.json({ message: 'store Activated successfully' });
        } catch (error) {
          res.status(400).json({ message: error.message });
        }
      },

inactivateStore: async (req, res) => {
        try {
          const { id } = req.query;
          console.log(req.query);
    
          const store = await Store.findById(id);
          if (!store) {
            return res.status(404).json({ message: 'store not found' });
          }
    
          store.is_active = false;
          await store.save();
    
          res.json({ message: 'store deactivated successfully' });
        } catch (error) {
          res.status(400).json({ message: error.message });
        }
      },

ActivateSelectedStores: async (req, res) => {
        try {
          const { storeIds } = req.body;
      
          if (!Array.isArray(storeIds) || storeIds.length === 0) {
            return res.status(400).json({ message: 'storeIds must be a non-empty array' });
          }
      
          const result = await Store.updateMany(
            { _id: { $in: storeIds } },
            { $set: { is_active: true } }
          );
      
          res.status(200).json({
            message: `🔒 Selected Stores activated successfully`,
            modifiedCount: result.modifiedCount
          });
        } catch (error) {
          res.status(500).json({ message: error.message });
        }
      },


inActivateSelectedStores: async (req, res) => {
        try {
          const { storeIds } = req.body;
      
          if (!Array.isArray(storeIds) || storeIds.length === 0) {
            return res.status(400).json({ message: 'storeIds must be a non-empty array' });
          }
      
          const result = await Store.updateMany(
            { _id: { $in: storeIds } },
            { $set: { is_active: false } }
          );
      
          res.status(200).json({
            message: `🔒 Selected Stores deactivated successfully`,
            modifiedCount: result.modifiedCount
          });
        } catch (error) {
          res.status(500).json({ message: error.message });
        }
      },

};

module.exports = controller;
