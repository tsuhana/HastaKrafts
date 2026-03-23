const db = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==================== MULTER CONFIG (Message Images) ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/messages");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `msg-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error("Only image files are allowed (jpeg, jpg, png, webp, gif)"));
  },
}).single("image");

// ==================== SEND MESSAGE ====================
const sendMessage = async (req, res) => {
  try {
    const { receiver_id, message_text, auction_id } = req.body;
    const sender_id = req.user.user_id;

    if (!receiver_id) {
      return res.status(400).json({ success: false, message: "Receiver is required" });
    }

    // Must have text OR image
    if (!message_text && !req.file) {
      return res.status(400).json({ success: false, message: "Message text or image is required" });
    }

    const image_url = req.file ? `/uploads/messages/${req.file.filename}` : null;

    const message = await db.Message.create({
      sender_id,
      receiver_id: parseInt(receiver_id),
      auction_id: auction_id || null,
      message_text: message_text || null,
      image_url,
      is_read: false,
    });

    const messageWithUsers = await db.Message.findByPk(message.message_id, {
      include: [
        {
          model: db.User,
          as: "sender",
          attributes: ["user_id", "full_name", "profile_image"],
        },
        {
          model: db.User,
          as: "receiver",
          attributes: ["user_id", "full_name", "profile_image"],
        },
      ],
    });

    try {
      global.io.to(`user_${receiver_id}`).emit("new_message", messageWithUsers);
    } catch (err) {
      console.log("Socket emit error:", err.message);
    }

    return res.status(201).json({ success: true, data: messageWithUsers });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

// ==================== SEND MESSAGE WITH IMAGE (multer wrapper) ====================
const sendMessageWithImage = (req, res) => {
  uploadImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || "Image upload failed" });
    }
    return sendMessage(req, res);
  });
};

// ==================== GET CONVERSATIONS ====================
const getConversations = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const messages = await db.Message.findAll({
      where: {
        [db.Sequelize.Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
      },
      include: [
        {
          model: db.User,
          as: "sender",
          attributes: ["user_id", "full_name", "profile_image"],
        },
        {
          model: db.User,
          as: "receiver",
          attributes: ["user_id", "full_name", "profile_image"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const conversationsMap = {};

    for (const msg of messages) {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      const partner = msg.sender_id === userId ? msg.receiver : msg.sender;
      if (!partner) continue;

      if (!conversationsMap[partnerId]) {
        // Show "📷 Photo" for image-only last messages
        const lastMsgText = msg.message_text
          ? msg.message_text
          : msg.image_url
          ? "📷 Photo"
          : "";

        conversationsMap[partnerId] = {
          partner_id: partnerId,
          partner_name: partner.full_name,
          partner_image: partner.profile_image,
          last_message: lastMsgText,
          last_message_time: msg.created_at,
          unread_count: 0,
        };
      }

      if (msg.receiver_id === userId && !msg.is_read) {
        conversationsMap[partnerId].unread_count++;
      }
    }

    const conversations = Object.values(conversationsMap).sort(
      (a, b) => new Date(b.last_message_time) - new Date(a.last_message_time)
    );

    return res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch conversations" });
  }
};

// ==================== GET MESSAGES WITH PARTNER ====================
const getMessages = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { partner_id } = req.params;

    const messages = await db.Message.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { sender_id: userId, receiver_id: partner_id },
          { sender_id: partner_id, receiver_id: userId },
        ],
      },
      include: [
        {
          model: db.User,
          as: "sender",
          attributes: ["user_id", "full_name", "profile_image"],
        },
        {
          model: db.User,
          as: "receiver",
          attributes: ["user_id", "full_name", "profile_image"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    await db.Message.update(
      { is_read: true },
      { where: { sender_id: partner_id, receiver_id: userId, is_read: false } }
    );

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
};

// ==================== GET UNREAD COUNT ====================
const getUnreadCount = async (req, res) => {
  try {
    const count = await db.Message.count({
      where: { receiver_id: req.user.user_id, is_read: false },
    });
    return res.status(200).json({
      success: true,
      data: { unread_count: count, count }, // keep both keys for compatibility
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    return res.status(500).json({ success: false, message: "Failed to get unread count" });
  }
};

module.exports = {
  sendMessage,
  sendMessageWithImage,
  getConversations,
  getMessages,
  getUnreadCount,
};