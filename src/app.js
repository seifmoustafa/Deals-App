const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const authRoutes = require('./routes/auth.routes');
const homeRoutes = require('./routes/home.routes');
const categoryRoutes = require('./routes/category.routes.js');
const storeRoutes = require('./routes/store.routes.js');
const couponRoutes = require('./routes/coupon.routes.js');
const userRoutes = require('./routes/user.routes.js');
const adminRoutes = require('./routes/admin.routes.js');
const announcementsRoutes = require('./routes/announcement.routes');
const notificationRoutes = require('./routes/notification.routes.js');
const bookmarkRoute = require('./routes/bookmark.routes');

const app = express();

app.use(helmet());
app.use(cors());

// 🟢 ملوتر لازم يشتغل من غير ما البودي يتاكل
// عشان كده نخلي روتات الصور تيجي قبل parsers
app.use('/api/users', userRoutes);

// باقي الروتات تقدر تستخدم parsers عادي
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/bookmarks', bookmarkRoute);

// Errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Something went wrong!' });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is healthy' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

module.exports = app;
