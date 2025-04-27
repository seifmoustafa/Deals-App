const queryBuilder = {
  coupons: (queryParams) => {
    const query = {};
    if (queryParams.search) {
      query.$or = [
        { title: { $regex: queryParams.search, $options: 'i' } },
        { description: { $regex: queryParams.search, $options: 'i' } },
      ];
    }

    if (queryParams.discount_type) {
      query.discount_type = queryParams.discount_type;
    }

    return query;
  },
  users: (queryParams) => {},
  stores: (queryParams) => {
    const query = {};
    if (queryParams.search) {
      query.$or = [
        { title: { $regex: queryParams.search, $options: 'i' } },
        { description: { $regex: queryParams.search, $options: 'i' } },
      ];
    }

    if (queryParams.category) {
      query.category = queryParams.category;
    }

    return query;
  },
  categories: (queryParams) => {},
  announcements: (queryParams) => {},
  admins: (queryParams) => {},
};

module.exports = queryBuilder;
