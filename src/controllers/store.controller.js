const Store = require('../models/Store.model');
const Coupon = require("../models/Coupon.model");
const Category = require("../models/Category.model");
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


       const query = {
      ...queryBuilder.stores(req.query),
      category: categoryId, // ✅ Force filter by category ID
      deleted_at: null,
    };

    const isActive = req.query.is_active;
    const isFeatured = req.query.is_featured;


    if (isActive === 'true' || isActive === 'false') {
      query.is_active = isActive === 'true';
    }

    if (isFeatured === 'true' || isFeatured === 'false') {
      query.is_featured = isFeatured === 'true';
    }

    const stores = await Store.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
       path: 'category',
       select: 'title slug',
       match: { deleted_at: null }, // 👈 only populate if not soft-deleted
    });
      // .populate('category', 'title slug');

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
      countries: req.body.countries,
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


  async search(req, res) {
    try {
      const {
        type = "all",
        search = "",
        page = 1,
        limit = 10,
        is_active,
        category,
      } = req.query;

      const skip = (page - 1) * limit;
      const searchRegex = new RegExp(search, "i");

      // Prepare queries
      const storeQuery = {
        deleted_at: null,
        $or: [{ title: searchRegex }, { sub_title: searchRegex }],
      };
      if (is_active !== undefined) storeQuery.is_active = is_active === "true";
      if (category) storeQuery.category = category;

      const couponQuery = {
        deleted_at: null,
        $or: [{ code: searchRegex }, { title: searchRegex }],
      };
      if (is_active !== undefined) couponQuery.is_active = is_active === "true";

      const categoryQuery = {
        deleted_at: null,
        $or: [{ title: searchRegex }, { slug: searchRegex }],
      };
      if (is_active !== undefined) categoryQuery.is_active = is_active === "true";

      // Results
      let results = {};

      if (type === "store" || type === "all") {
        const [data, total] = await Promise.all([
          Store.find(storeQuery).skip(skip).limit(Number(limit)),
          Store.countDocuments(storeQuery),
        ]);
        results.stores = { data, total };
      }

      if (type === "coupon" || type === "all") {
        const [data, total] = await Promise.all([
          Coupon.find(couponQuery).skip(skip).limit(Number(limit)),
          Coupon.countDocuments(couponQuery),
        ]);
        results.coupons = { data, total };
      }

      if (type === "category" || type === "all") {
        const [data, total] = await Promise.all([
          Category.find(categoryQuery).skip(skip).limit(Number(limit)),
          Category.countDocuments(categoryQuery),
        ]);
        results.categories = { data, total };
      }

      res.json({
        success: true,
        page: Number(page),
        limit: Number(limit),
        results,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  },



getStoresByUserCountry : async (req, res) => {
  try {
    const userCountry = req.user.country;
    if (!userCountry) {
      return res.status(400).json({ message: 'User country not set' });
    }

    // pagination params
    const pageNo = parseInt(req.query.pageNo) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (pageNo - 1) * pageSize;

    // search param
    const search = req.query.search?.trim();

    // base match (country filter always)
    let matchStage = { countries: userCountry };

    // aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'storecategories', 
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    ];

    
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { sub_title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { 'category.title': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    // total count
    const totalCountPipeline = [...pipeline, { $count: 'count' }];
    const totalCountResult = await Store.aggregate(totalCountPipeline);
    const itemsCount = totalCountResult[0]?.count || 0;

    // add pagination
    pipeline.push({ $skip: skip }, { $limit: pageSize });

    // run pipeline
    const stores = await Store.aggregate(pipeline);

    res.json({
      data: stores,
      pagination: {
        pageNo,
        pageSize,
        itemsCount,
        totalPages: Math.ceil(itemsCount / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching stores by country:', error);
    res.status(500).json({ message: 'Internal server error' });
  }

  }


};

module.exports = controller;
