const db = require("../models");
const path = require("path");
const fs = require("fs");

// ==================== GET ALL ACTIVE BANNERS (PUBLIC) ====================
exports.getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    
    const banners = await db.Banner.findAll({
      where: {
        is_active: true,
        [db.Sequelize.Op.or]: [
          { start_date: null, end_date: null },
          { 
            start_date: { [db.Sequelize.Op.lte]: now },
            end_date: { [db.Sequelize.Op.gte]: now }
          },
          { 
            start_date: { [db.Sequelize.Op.lte]: now },
            end_date: null
          }
        ]
      },
      order: [['display_order', 'ASC'], ['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Get active banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners'
    });
  }
};

// ==================== GET ALL BANNERS (ADMIN) ====================
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await db.Banner.findAll({
      order: [['display_order', 'ASC'], ['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Get all banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners'
    });
  }
};

// ==================== CREATE BANNER (ADMIN) ====================
exports.createBanner = async (req, res) => {
  try {
    const { title, description, link_url, link_type, display_order, start_date, end_date } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Title and image are required'
      });
    }

    const image = `/uploads/banners/${req.file.filename}`;

    const banner = await db.Banner.create({
      title,
      description: description || null,
      image,
      link_url: link_url || null,
      link_type: link_type || 'none',
      display_order: display_order || 0,
      start_date: start_date || null,
      end_date: end_date || null,
      is_active: true
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: banner
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create banner'
    });
  }
};

// ==================== UPDATE BANNER (ADMIN) ====================
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, link_url, link_type, display_order, is_active, start_date, end_date } = req.body;

    const banner = await db.Banner.findByPk(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    let image = banner.image;

    // If new image uploaded, delete old and update
    if (req.file) {
      const oldImagePath = path.join(__dirname, '..', banner.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      image = `/uploads/banners/${req.file.filename}`;
    }

    await banner.update({
      title: title || banner.title,
      description: description !== undefined ? description : banner.description,
      image,
      link_url: link_url !== undefined ? link_url : banner.link_url,
      link_type: link_type || banner.link_type,
      display_order: display_order !== undefined ? display_order : banner.display_order,
      is_active: is_active !== undefined ? is_active : banner.is_active,
      start_date: start_date !== undefined ? start_date : banner.start_date,
      end_date: end_date !== undefined ? end_date : banner.end_date,
    });

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: banner
    });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner'
    });
  }
};

// ==================== DELETE BANNER (ADMIN) ====================
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await db.Banner.findByPk(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Delete image file
    const imagePath = path.join(__dirname, '..', banner.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await banner.destroy();

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner'
    });
  }
};

// ==================== TOGGLE BANNER STATUS (ADMIN) ====================
exports.toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await db.Banner.findByPk(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    banner.is_active = !banner.is_active;
    await banner.save();

    res.json({
      success: true,
      message: `Banner ${banner.is_active ? 'activated' : 'deactivated'}`,
      data: banner
    });
  } catch (error) {
    console.error('Toggle banner status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle banner status'
    });
  }
};