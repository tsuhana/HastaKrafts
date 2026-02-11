const { User, Seller } = require('../models');

const createTestSeller = async () => {
  try {
    console.log('🔍 Checking for test seller...');

    // Check if seller already exists
    const existingSeller = await User.findOne({ 
      where: { email: 'seller1@hastakrafts.com' } 
    });

    if (existingSeller) {
      console.log('✅ Test seller already exists:', existingSeller.email);
      return;
    }

    console.log('🔐 Creating test seller account...');

    // Create seller user (password will be hashed automatically)
    const user = await User.create({
      email: 'seller1@hastakrafts.com',
      password: 'Seller@123', // Will be hashed by beforeCreate hook
      full_name: 'Test Seller',
      phone: '9801234567',
      role: 'seller',
      is_active: true
    });

    // Create seller profile with ALL required fields
    await Seller.create({
      user_id: user.user_id,
      shop_name: 'Nepali Handicrafts Shop',
      shop_description: 'Traditional Nepali handicrafts and artifacts',
      address: 'Thamel, Kathmandu',
      city: 'Kathmandu',
      citizenship_number: '12345-6789-0123',
      approval_status: 'approved', // Pre-approved for testing
      is_approved: true,
      approved_at: new Date()
    });

    console.log('✅ Test seller created successfully!');
    console.log('📧 Email:', user.email);
    console.log('🔑 Password: Seller@123');
    console.log('🏪 Shop: Nepali Handicrafts Shop');
    console.log('✅ Status: Pre-approved for testing');

  } catch (error) {
    console.error('❌ Error creating test seller:', error.message);
  }
};

module.exports = createTestSeller;