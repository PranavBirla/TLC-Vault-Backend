const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");

const {
  submitFeedback,
} = require("../controllers/feedback.controller");

router.post("/", authMiddleware, submitFeedback);

module.exports = router;