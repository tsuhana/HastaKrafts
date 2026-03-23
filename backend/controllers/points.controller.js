const db = require("../models");

// ==================== GET USER POINTS BALANCE ====================
const getUserPoints = async (req, res) => {
  try {
    const userPoints = await db.UserPoints.findOne({
      where: { user_id: req.user.user_id },
    });

    if (!userPoints) {
      const newPoints = await db.UserPoints.create({
        user_id: req.user.user_id,
        total_points: 0,
        lifetime_earned: 0,
        lifetime_redeemed: 0,
      });
      return res.json({ success: true, data: newPoints });
    }

    res.json({ success: true, data: userPoints });
  } catch (error) {
    console.error("Get user points error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch points" });
  }
};

// ==================== GET POINTS TRANSACTION HISTORY ====================
const getPointsHistory = async (req, res) => {
  try {
    const transactions = await db.PointTransaction.findAll({
      where: { user_id: req.user.user_id },
      include: [
        {
          model: db.Order,
          as: "order",
          attributes: ["order_number", "total"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: 50,
    });

    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error("Get points history error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch points history" });
  }
};

// ==================== AWARD POINTS (INTERNAL - Called after order completes) ====================
const awardPoints = async (userId, orderId, orderTotal) => {
  try {
    const pointsToAward = Math.floor(orderTotal / 100);
    if (pointsToAward === 0) return 0;

    // DUPLICATE GUARD — blocks double-award if awardPoints is called twice
    // for the same order (e.g. Khalti callback page refreshed, or request fired twice)
    const existing = await db.PointTransaction.findOne({
      where: { user_id: userId, order_id: orderId, type: "earned" },
    });
    if (existing) {
      console.log(`  Duplicate award blocked — order ${orderId} already has earned transaction`);
      return 0;
    }

    let userPoints = await db.UserPoints.findOne({ where: { user_id: userId } });

    if (!userPoints) {
      userPoints = await db.UserPoints.create({
        user_id: userId,
        total_points: 0,
        lifetime_earned: 0,
        lifetime_redeemed: 0,
      });
    }

    await userPoints.update({
      total_points:    userPoints.total_points    + pointsToAward,
      lifetime_earned: userPoints.lifetime_earned + pointsToAward,
    });

    await db.PointTransaction.create({
      user_id:     userId,
      order_id:    orderId,
      points:      pointsToAward,
      type:        "earned",
      description: `Earned ${pointsToAward} points from order`,
    });

    console.log(` Awarded ${pointsToAward} points to user ${userId} for order ${orderId}`);
    return pointsToAward;
  } catch (error) {
    console.error("Award points error:", error);
    return 0;
  }
};

// ==================== REDEEM POINTS (INTERNAL - Called during checkout) ====================
const redeemPoints = async (userId, pointsToRedeem) => {
  try {
    const userPoints = await db.UserPoints.findOne({ where: { user_id: userId } });

    if (!userPoints || userPoints.total_points < pointsToRedeem) {
      throw new Error("Insufficient points");
    }

    await userPoints.update({
      total_points:      userPoints.total_points      - pointsToRedeem,
      lifetime_redeemed: userPoints.lifetime_redeemed + pointsToRedeem,
    });

    console.log(` Redeemed ${pointsToRedeem} points for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Redeem points error:", error);
    throw error;
  }
};

module.exports = {
  getUserPoints,
  getPointsHistory,
  awardPoints,
  redeemPoints,
};