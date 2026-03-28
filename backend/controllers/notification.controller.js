const db = require("../models");

// ==================== GET MY NOTIFICATIONS ====================
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await db.Notification.findAll({
      where: { user_id: req.user.user_id },
      order: [["created_at", "DESC"]],
      limit: 50,
    });
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

// ==================== MARK ONE AS READ ====================
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await db.Notification.update(
      { is_read: true },
      { where: { notification_id: id, user_id: req.user.user_id } }
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
};

// ==================== MARK ALL AS READ ====================
const markAllAsRead = async (req, res) => {
  try {
    await db.Notification.update(
      { is_read: true },
      { where: { user_id: req.user.user_id, is_read: false } }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
};

// ==================== GET UNREAD COUNT ====================
const getUnreadCount = async (req, res) => {
  try {
    const count = await db.Notification.count({
      where: { user_id: req.user.user_id, is_read: false },
    });
    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    console.error("Unread count error:", error);
    res.status(500).json({ success: false, message: "Failed to get unread count" });
  }
};

// ==================== DELETE ONE ====================
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await db.Notification.destroy({
      where: { notification_id: id, user_id: req.user.user_id },
    });
    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
};