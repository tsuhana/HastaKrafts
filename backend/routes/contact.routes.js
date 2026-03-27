const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/roleCheck.middleware");
const { submitContactRules } = require("../validations/contact.validation");
const { updateContactStatusRules } = require("../validations/admin.validation");

// ==================== PUBLIC ====================
router.post("/submit", submitContactRules, contactController.submitContactMessage);

// ==================== ADMIN ====================
router.get("/",     authenticate, checkRole("admin"), contactController.getAllContactMessages);
router.put("/:id",  authenticate, checkRole("admin"), updateContactStatusRules, contactController.updateContactStatus);
router.delete("/:id", authenticate, checkRole("admin"), contactController.deleteContactMessage);

module.exports = router;