const db = require("../models");

// ==================== SUBMIT CONTACT MESSAGE (PUBLIC) ====================
exports.submitContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const contact = await db.Contact.create({
      name,
      email,
      phone: phone || null,
      subject,
      message,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon.',
      data: contact
    });
  } catch (error) {
    console.error('Submit contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again.'
    });
  }
};

// ==================== GET ALL CONTACT MESSAGES (ADMIN) ====================
exports.getAllContactMessages = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const contacts = await db.Contact.findAll({
      where,
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact messages'
    });
  }
};

// ==================== UPDATE CONTACT STATUS (ADMIN) ====================
exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_reply } = req.body;

    const contact = await db.Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    await contact.update({
      status: status || contact.status,
      admin_reply: admin_reply || contact.admin_reply,
      replied_at: admin_reply ? new Date() : contact.replied_at
    });

    res.json({
      success: true,
      message: 'Contact message updated successfully',
      data: contact
    });
  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact message'
    });
  }
};

// ==================== DELETE CONTACT MESSAGE (ADMIN) ====================
exports.deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await db.Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    await contact.destroy();

    res.json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact message'
    });
  }
};