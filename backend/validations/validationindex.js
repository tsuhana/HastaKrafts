const { validationResult } = require("express-validator");

/**
 * Runs after any express-validator chain.
 * If errors exist, returns the first error message and stops the request.
 * Otherwise calls next() so the controller runs normally.
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }
  next();
};

module.exports = { handleValidation };