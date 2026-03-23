const jwt = require("jsonwebtoken");
const db = require("../models");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please login.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.User.findByPk(decoded.user_id);

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive.",
      });
    }

    req.user = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// ── Optional: attaches user if token present, passes through as guest if not ──
const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next(); // no token = guest, keep going
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    req.user = null;
    next(); // invalid token = treat as guest, don't reject
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please authenticate first",
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this resource",
      });
    }
    next();
  };
};

module.exports = { authenticate, optionalAuthenticate, authorize };