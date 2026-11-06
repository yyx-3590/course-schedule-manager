const express = require("express");
const {
  registerUser,
  loginUser,
  currentUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");
const validateToken = require("../middleware/validateTokenHandler");
const validate = require("../middleware/validate");
const { authLimiter } = require("../middleware/rateLimiter");
const {
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
} = require("../validators/userSchemas");

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), registerUser);
router.post("/login", authLimiter, validate(loginSchema), loginUser);
router.post("/forgot-password", authLimiter, validate(forgotSchema), forgotPassword);
router.post("/reset-password", authLimiter, validate(resetSchema), resetPassword);
router.get("/current", validateToken, currentUser);

module.exports = router;
