const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getConversations,
  getMessages,
  getUnreadCount,
} = require("../controllers/message.controller");
const { authenticate } = require("../middlewares/auth.middleware");

// All message routes require authentication
router.use(authenticate);

router.post("/send", sendMessage);
router.get("/conversations", getConversations);
router.get("/unread-count", getUnreadCount);
router.get("/:partner_id", getMessages);

module.exports = router;