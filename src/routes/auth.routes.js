const express = require("express");

const {
  register,
  login,
  logout,
  getMe,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/me", authMiddleware, getMe);

module.exports = router;