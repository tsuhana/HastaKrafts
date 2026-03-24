const db = require("../models");
const { sendContactReplyEmail } = require("../utils/email");

// ================= HELPERS =================
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());

const sanitize = (val, maxLen) =>
  typeof val === "string" ? val.trim().substring(0, maxLen) : "";

// ================= SUBMIT =================
const submitContactMessage = async (req, res) => {
  try {
    let { name, email, phone, subject, message } = req.body;

    name = sanitize(name, 200);
    email = sanitize(email, 200);
    subject = sanitize(subject, 300);
    message = sanitize(message, 5000);
    phone = sanitize(phone, 20);

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const contact = await db.Contact.create({
      name,
      email,
      phone: phone || null,
      subject,
      message,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Submit error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// ================= GET ALL =================
const getAllContactMessages = async (req, res) => {
  try {
    const { status, search } = req.query;

    const where = {};

    if (status) where.status = status;

    if (search) {
      const q = `%${search}%`;
      where[db.Sequelize.Op.or] = [
        { name: { [db.Sequelize.Op.iLike]: q } },
        { email: { [db.Sequelize.Op.iLike]: q } },
        { subject: { [db.Sequelize.Op.iLike]: q } },
      ];
    }

    const contacts = await db.Contact.findAll({
      where,
      order: [["created_at", "DESC"]],
    });

    return res.json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error("Fetch error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contacts",
    });
  }
};

// ================= UPDATE (REPLY) =================
const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_reply } = req.body;

    const contact = await db.Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    const trimmedReply = admin_reply?.trim();

    const isNewReply =
      trimmedReply &&
      trimmedReply.length > 0 &&
      trimmedReply !== contact.admin_reply;

    let updatedStatus = status || contact.status;

    // 🔥 AUTO RESOLVE WHEN REPLY
    if (isNewReply) {
      updatedStatus = "resolved";
    }

    await contact.update({
      status: updatedStatus,
      admin_reply:
        trimmedReply !== undefined ? trimmedReply : contact.admin_reply,
      replied_at: isNewReply ? new Date() : contact.replied_at,
    });

    // SEND EMAIL
    if (isNewReply) {
      try {
        await sendContactReplyEmail(
          contact.email,
          contact.name,
          contact.subject,
          contact.message,
          trimmedReply
        );
      } catch (err) {
        console.error("Email error:", err.message);
      }
    }

    return res.json({
      success: true,
      message: isNewReply
        ? "Reply sent & marked resolved"
        : "Contact updated",
      data: contact,
    });
  } catch (error) {
    console.error("Update error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update contact",
    });
  }
};

// ================= DELETE =================
const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await db.Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    await contact.destroy();

    return res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete",
    });
  }
};

// ================= EXPORT =================
module.exports = {
  submitContactMessage,
  getAllContactMessages,
  updateContactStatus,
  deleteContactMessage,
};