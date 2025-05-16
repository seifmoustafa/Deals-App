const Admin = require('../models/Admin.model');

const seedSuperAdmin = async () => {
  try {
    const existing = await Admin.findOne({ username: 'superadmin' });
    if (existing) {
      console.log('👤 Superadmin already exists');
      return;
    }

    const superadmin = new Admin({
      full_name: 'Super Admin',
      username: 'superadmin',
      email: 'superadmin@example.com',
      password: 'P@ssw0rd', // Will be hashed via pre-save hook
      role: 'super',
      is_active: true,
    });

    await superadmin.save();
    console.log('✅ Superadmin created');
  } catch (error) {
    console.error('❌ Error seeding superadmin:', error.message);
  }
};

module.exports = { seedSuperAdmin };
