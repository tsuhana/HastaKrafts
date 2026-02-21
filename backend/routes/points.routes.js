const express = require("express");
const router = express.Router();
const { getUserPoints, getPointsHistory } = require("../controllers/points.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/roleCheck.middleware");

// All points routes require buyer role
router.use(authenticate);
router.use(checkRole("buyer"));

// Get user points balance
router.get("/balance", getUserPoints);

// Get points transaction history
router.get("/history", getPointsHistory);

module.exports = router;