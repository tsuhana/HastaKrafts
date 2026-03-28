const express = require("express");
const router  = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} = require("../controllers/notification.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.use(authenticate);

router.get("/",               getMyNotifications);
router.get("/unread-count",   getUnreadCount);
router.patch("/:id/read",     markAsRead);
router.patch("/mark-all-read", markAllAsRead);
router.delete("/:id",         deleteNotification);

module.exports = router;