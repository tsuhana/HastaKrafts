const db = require("../models");
const fs = require("fs");
const path = require("path");

// ==================== CREATE STORY (SELLER) ====================
const createStory = async (req, res) => {
  try {
    const { title, content, excerpt, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const seller = await db.Seller.findOne({
      where: { user_id: req.user.user_id },
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      });
    }

    const images = req.files ? req.files.map((file) => `/uploads/stories/${file.filename}`) : [];
    const featured_image = images[0] || null;

    const story = await db.Story.create({
      seller_id: seller.seller_id,
      title,
      content,
      excerpt: excerpt || content.substring(0, 200) + '...',
      featured_image,
      images,
      category: category || 'other',
      is_published: true,
      published_at: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Story published successfully!",
      data: story,
    });
  } catch (error) {
    console.error("Create story error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create story",
    });
  }
};

// ==================== GET ALL STORIES (PUBLIC) ====================
const getAllStories = async (req, res) => {
  try {
    const { category, seller_id, page = 1, limit = 12 } = req.query;

    const where = { is_published: true };
    if (category) where.category = category;
    if (seller_id) where.seller_id = seller_id;

    const offset = (page - 1) * limit;

    const { count, rows: stories } = await db.Story.findAndCountAll({
      where,
      include: [
        {
          model: db.Seller,
          as: "seller",
          attributes: ["seller_id", "shop_name", "shop_logo", "city"],
          include: [
            {
              model: db.User,
              as: "user",
              attributes: ["user_id", "full_name", "profile_image"],
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["published_at", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        stories,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get stories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stories",
    });
  }
};

// ==================== GET SINGLE STORY ====================
const getStoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const story = await db.Story.findByPk(id, {
      include: [
        {
          model: db.Seller,
          as: "seller",
          attributes: ["seller_id", "shop_name", "shop_description", "shop_logo", "city"],
          include: [
            {
              model: db.User,
              as: "user",
              attributes: ["user_id", "full_name", "profile_image"], // ✅
            },
          ],
        },
      ],
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    story.views_count += 1;
    await story.save();

    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    console.error("Get story error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch story",
    });
  }
};

// ==================== GET SELLER'S STORIES ====================
const getSellerStories = async (req, res) => {
  try {
    const seller = await db.Seller.findOne({
      where: { user_id: req.user.user_id },
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      });
    }

    const stories = await db.Story.findAll({
      where: { seller_id: seller.seller_id },
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: stories,
    });
  } catch (error) {
    console.error("Get seller stories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stories",
    });
  }
};

// ==================== UPDATE STORY ====================
const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, category, is_published } = req.body;

    const story = await db.Story.findByPk(id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    const seller = await db.Seller.findOne({
      where: { user_id: req.user.user_id },
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    if (story.seller_id !== seller.seller_id) {
      return res.status(403).json({
        success: false,
        message: "No permission",
      });
    }

    await story.update({
      title: title ?? story.title,
      content: content ?? story.content,
      excerpt: excerpt ?? story.excerpt,
      category: category ?? story.category,
      is_published: is_published ?? story.is_published,
      published_at: is_published
        ? (story.published_at || new Date())
        : null,
    });

    res.json({
      success: true,
      message: "Story updated",
      data: story,
    });
  } catch (error) {
    console.error("Update story error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Update failed",
    });
  }
};
// ==================== DELETE STORY ====================
const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;

    const story = await db.Story.findByPk(id);
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }

    const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });

    if (!seller) {
      return res.status(403).json({ success: false, message: "Seller profile not found" });
    }

    if (story.seller_id !== seller.seller_id) {
      return res.status(403).json({ success: false, message: "You don't have permission to delete this story" });
    }

    (story.images || []).forEach((img) => {
      const filePath = path.join(__dirname, "..", img);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await story.destroy();

    res.json({ success: true, message: "Story deleted successfully" });
  } catch (error) {
    console.error("Delete story error:", error);
    res.status(500).json({ success: false, message: "Failed to delete story" });
  }
};

module.exports = {
  createStory,
  getAllStories,
  getStoryById,
  getSellerStories,
  updateStory,
  deleteStory,
};