const express = require("express");
const router = express.Router();
const { getUserPoints, getPointsHistory } = require("../controllers/points.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/roleCheck.middleware");

// All points routes require buyer authentication
router.use(authenticate);
router.use(checkRole("buyer"));

router.get("/balance", getUserPoints);
router.get("/history", getPointsHistory);

module.exports = router;