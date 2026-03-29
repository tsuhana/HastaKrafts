const express = require("express");
const router = express.Router();
const { sendMessageWithImage, getConversations, getMessages, getUnreadCount } = require("../controllers/message.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { sendMessageRules } = require("../validations/message.validation");

router.use(authenticate);

router.post("/send", sendMessageWithImage);
router.get("/conversations",      getConversations);
router.get("/unread-count",       getUnreadCount);
router.get("/:partner_id",        getMessages);

module.exports = router;