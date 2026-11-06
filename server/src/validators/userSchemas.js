const { z } = require("zod");

const registerSchema = z.object({
  username: z.string().trim().min(2, "Username is too short").max(50),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

const resetSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

module.exports = { registerSchema, loginSchema, forgotSchema, resetSchema };
