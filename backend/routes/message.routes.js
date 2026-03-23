const express = require("express");
const router = express.Router();
const {
  sendMessageWithImage,
  getConversations,
  getMessages,
  getUnreadCount,
} = require("../controllers/message.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.use(authenticate);

router.post("/send", sendMessageWithImage);         // handles both text-only and image
router.get("/conversations", getConversations);
router.get("/unread-count", getUnreadCount);
router.get("/:partner_id", getMessages);

module.exports = router;