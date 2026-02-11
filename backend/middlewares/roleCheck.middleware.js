const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
};

const checkSellerApproval = async (req, res, next) => {
  try {
    if (req.user.role !== "seller") {
      return next();
    }

    const db = require("../models");
    const seller = await db.Seller.findOne({
      where: { user_id: req.user.user_id },
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      });
    }

    if (seller.approval_status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your seller account is not approved yet",
      });
    }

    req.seller = seller;
    next();
  } catch (error) {
    console.error("Check seller approval error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking seller approval",
    });
  }
};

module.exports = { checkRole, checkSellerApproval };