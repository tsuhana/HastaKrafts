const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/roleCheck.middleware');

// ==================== PUBLIC ROUTES ====================
router.post('/submit', contactController.submitContactMessage);

// ==================== ADMIN ROUTES ====================
router.get('/', authenticate, checkRole('admin'), contactController.getAllContactMessages);
router.put('/:id', authenticate, checkRole('admin'), contactController.updateContactStatus);
router.delete('/:id', authenticate, checkRole('admin'), contactController.deleteContactMessage);

module.exports = router;