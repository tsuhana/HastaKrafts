const db = require("../models");

// IMPORT YOUR EMAIL FUNCTION 
const { sendContactReplyEmail } = require("../utils/email");

// ==================== HELPERS ====================
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());

const sanitize = (val, maxLen) =>
  typeof val === "string" ? val.trim().substring(0, maxLen) : "";

// ==================== SUBMIT CONTACT MESSAGE ====================
exports.submitContactMessage = async (req, res) => {
  try {
    let { name, email, phone, subject, message } = req.body;

    // sanitize
    name = sanitize(name, 200);
    email = sanitize(email, 200);
    subject = sanitize(subject, 300);
    message = sanitize(message, 5000);
    phone = sanitize(phone, 20);

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, subject, and message.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (name.length < 2 || subject.length < 3 || message.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Validation failed: check input lengths",
      });
    }

    // rate limit (3/hr)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentCount = await db.Contact.count({
      where: {
        email,
        created_at: { [db.Sequelize.Op.gte]: oneHourAgo },
      },
    });

    if (recentCount >= 3) {
      return res.status(429).json({
        success: false,
        message: "Too many messages. Try again later.",
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

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Submit error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// ==================== GET ALL ====================
exports.getAllContactMessages = async (req, res) => {
  try {
    const { status, page, limit: limitParam, search } = req.query;

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

    if (page) {
      const limit = Math.min(parseInt(limitParam) || 20, 100);
      const offset = (parseInt(page) - 1) * limit;

      const { count, rows } = await db.Contact.findAndCountAll({
        where,
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      return res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    }

    const contacts = await db.Contact.findAll({
      where,
      order: [["created_at", "DESC"]],
    });

    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error("Fetch error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contacts",
    });
  }
};

// ==================== UPDATE + SEND EMAIL ====================
exports.updateContactStatus = async (req, res) => {
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
      trimmedReply && trimmedReply !== contact.admin_reply;

    await contact.update({
      status: status || contact.status,
      admin_reply:
        trimmedReply !== undefined ? trimmedReply : contact.admin_reply,
      replied_at: isNewReply ? new Date() : contact.replied_at,
    });

    // FIXED: use your email util instead of transporter
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
        console.error("Email send error (non-fatal):", err.message);
      }
    }

    res.json({
      success: true,
      message: "Contact updated successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Update error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update contact",
    });
  }
};

// ==================== DELETE ====================
exports.deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }

    const contact = await db.Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    await contact.destroy();

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete",
    });
  }
};