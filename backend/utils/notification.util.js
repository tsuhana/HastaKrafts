const axios = require("axios");

const WEBPUSHR_KEY        = process.env.WEBPUSHR_KEY;
const WEBPUSHR_AUTH_TOKEN = process.env.WEBPUSHR_AUTH_TOKEN;

// ==================== SEND PUSH NOTIFICATION ====================
const sendPushNotification = async (sid, title, message, url = "http://localhost:5173") => {
  if (!WEBPUSHR_KEY || !WEBPUSHR_AUTH_TOKEN) {
    console.warn("WebPushr credentials missing — skipping push notification");
    return;
  }
  if (!sid) {
    console.warn("No subscriber ID — skipping push notification");
    return;
  }
  try {
    await axios.post(
      "https://api.webpushr.com/v1/notification/send/sid",
      { title, message, target_url: url, sid },
      {
        headers: {
          webpushrKey:       WEBPUSHR_KEY,
          webpushrAuthToken: WEBPUSHR_AUTH_TOKEN,
          "Content-Type":    "application/json",
        },
      }
    );
    console.log(`✅ Push sent to sid ${sid}: ${title}`);
  } catch (err) {
    console.error("Push notification error:", err.response?.data || err.message);
  }
};

// ==================== BROADCAST PUSH ====================
const sendBroadcastNotification = async (title, message, url = "http://localhost:5173") => {
  if (!WEBPUSHR_KEY || !WEBPUSHR_AUTH_TOKEN) return;
  try {
    await axios.post(
      "https://api.webpushr.com/v1/notification/send/all",
      { title, message, target_url: url },
      {
        headers: {
          webpushrKey:       WEBPUSHR_KEY,
          webpushrAuthToken: WEBPUSHR_AUTH_TOKEN,
          "Content-Type":    "application/json",
        },
      }
    );
    console.log(`✅ Broadcast push sent: ${title}`);
  } catch (err) {
    console.error("Broadcast push error:", err.response?.data || err.message);
  }
};

// ==================== CREATE IN-APP NOTIFICATION ====================
const createNotification = async (userId, type, title, message, link = null, data = null) => {
  try {
    const db = require("../models");
    const notification = await db.Notification.create({
      user_id: userId, type, title, message, link, data, is_read: false,
    });

    // Real-time via Socket.io
    try {
      global.io.to(`user_${userId}`).emit("new_notification", {
        notification_id: notification.notification_id,
        type, title, message, link, data,
        is_read: false,
        created_at: notification.created_at,
      });
    } catch (_) {}

    return notification;
  } catch (err) {
    console.error("Create notification error (non-fatal):", err.message);
  }
};

module.exports = { sendPushNotification, sendBroadcastNotification, createNotification };