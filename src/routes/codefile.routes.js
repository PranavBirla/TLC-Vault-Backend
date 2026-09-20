const express = require("express");

const {
  createCodeFile,
  getCodeFiles,
  getCodeFile,
  updateCodeFile,
  deleteCodeFile,
} = require("../controllers/codefile.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/repositories/:repoId/files",
  authMiddleware,
  createCodeFile
);

router.get(
  "/repositories/:repoId/files",
  authMiddleware,
  getCodeFiles
);

router.get(
  "/codefiles/:fileId",
  authMiddleware,
  getCodeFile
);

router.patch(
  "/codefiles/:fileId",
  authMiddleware,
  updateCodeFile
);

router.delete(
  "/codefiles/:fileId",
  authMiddleware,
  deleteCodeFile
);

module.exports = router;