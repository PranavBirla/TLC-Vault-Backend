const express = require("express");

const {
  register,
  login,
  verifyEmail,
  resendVerification,
  logout,
  getMe,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/logout", logout);

router.get("/me", authMiddleware, getMe);

module.exports = router;
