const rateLimit = require("express-rate-limit");

// Slows down brute-force attempts on login and register.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
});

module.exports = { authLimiter };
