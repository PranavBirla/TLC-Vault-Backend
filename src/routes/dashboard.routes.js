const express = require("express");

const {
  getDashboardSummaryController,
} = require("../controllers/dashboard.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/summary",
  authMiddleware,
  getDashboardSummaryController
);

module.exports = router;