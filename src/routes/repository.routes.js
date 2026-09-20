const express = require("express");

const {
    createRepository,
    getRepositories,
    getRepository,
    updateRepository,
    deleteRepository,
} = require("../controllers/repository.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, createRepository);
router.get("/", authMiddleware, getRepositories);

router.get("/:repoId", authMiddleware, getRepository);

router.patch("/:repoId", authMiddleware, updateRepository);

router.delete("/:repoId", authMiddleware, deleteRepository);


module.exports = router;