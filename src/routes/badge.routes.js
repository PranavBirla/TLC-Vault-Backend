const express = require("express");

const {
  getUserBadgesController,
} = require("../controllers/badge.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  getUserBadgesController
);

module.exports = router;