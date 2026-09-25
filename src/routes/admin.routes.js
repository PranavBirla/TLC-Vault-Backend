const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

const { getAdminStats, getAdminUsers, getAdminRepositories, getAdminCodeFiles, getAdminAnalytics } = require("../controllers/admin.controller");

router.get(
  "/stats",
  authMiddleware,
  adminMiddleware,
  getAdminStats
);

router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  getAdminUsers
);

router.get(
  "/repositories",
  authMiddleware,
  adminMiddleware,
  getAdminRepositories
);

router.get(
  "/codefiles",
  authMiddleware,
  adminMiddleware,
  getAdminCodeFiles
);

router.get(
  "/analytics",
  authMiddleware,
  adminMiddleware,
  getAdminAnalytics
);

module.exports = router;