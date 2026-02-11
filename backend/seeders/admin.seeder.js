const bcrypt = require('bcryptjs');
const { User } = require('../models');

const createAdmin = async () => {
  try {
    console.log('🔍 Checking for existing admin...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      where: { role: 'admin' } 
    });

    if (existingAdmin) {
      console.log('✅ Admin already exists:', existingAdmin.email);
      return;
    }

    console.log('🔐 Creating admin account...');

    // IMPORTANT: Don't hash manually - User model does it automatically!
    const admin = await User.create({
      email: 'admin@hastakrafts.com',
      password: 'Admin@123', // Will be hashed by beforeCreate hook
      full_name: 'System Administrator',
      phone: '9876543210',
      role: 'admin',
      is_active: true
    });

    console.log('✅ Admin created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: Admin@123');
    console.log('⚠️  IMPORTANT: Change this password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }
};

module.exports = createAdmin;