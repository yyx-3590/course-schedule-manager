const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const { sendMail } = require("../utils/mailer");

const RESET_MINUTES = 30;
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

//@desc Register a user
//@route POST /api/users/register
//@access public
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  const userAvailable = await User.findOne({ email });
  if (userAvailable) {
    res.status(400);
    throw new Error("User already registered!");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, password: hashedPassword });

  res.status(201).json({ _id: user.id, email: user.email });
};

//@desc Login a user
//@route POST /api/users/login
//@access public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    const accessToken = jwt.sign(
      { user: { username: user.username, email: user.email, id: user.id } },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );
    return res.status(200).json({ accessToken });
  }

  // Same message for unknown email and wrong password
  res.status(401);
  throw new Error("email or password is not valid");
};

//@desc Current user info
//@route GET /api/users/current
//@access private
const currentUser = async (req, res) => {
  res.json(req.user);
};

//@desc Send a password reset link by email
//@route POST /api/users/forgot-password
//@access public
const forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (user) {
    // The link holds a random token. Only its hash is saved, and it works once.
    const token = crypto.randomBytes(32).toString("hex");
    user.resetTokenHash = sha256(token);
    user.resetTokenExpires = new Date(Date.now() + RESET_MINUTES * 60 * 1000);
    await user.save();

    const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token}`;
    try {
      await sendMail({
        to: user.email,
        subject: "Reset your Course Schedule password",
        text: `Use this link to choose a new password. It works for ${RESET_MINUTES} minutes.\n\n${link}\n\nIf you did not ask for this, you can ignore this email.`,
      });
    } catch (err) {
      console.error("Could not send the reset email:", err.message);
    }
  }

  // Same answer whether or not the email is registered, so nobody can probe for accounts
  res.status(200).json({ message: "If that email is registered, a reset link is on its way." });
};

//@desc Set a new password with a reset token
//@route POST /api/users/reset-password
//@access public
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  const user = await User.findOne({
    resetTokenHash: sha256(token),
    resetTokenExpires: { $gt: new Date() },
  });
  if (!user) {
    res.status(400);
    throw new Error("This reset link is invalid or has expired");
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Password updated. You can log in now." });
};

module.exports = { registerUser, loginUser, currentUser, forgotPassword, resetPassword };
