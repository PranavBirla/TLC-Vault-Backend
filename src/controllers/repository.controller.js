const Repository = require("../models/repository.model");
const CodeFile = require("../models/codefile.model");

const createRepository = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Repository name is required",
      });
    }

    const repository = await Repository.create({
      userId: req.user._id,
      name: name.trim(),
      description: description?.trim() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Repository created successfully",
      repository,
    });
  } catch (error) {
    console.error("Create repository error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create repository",
    });
  }
};

const getRepositories = async (req, res) => {
  try {
    const repositories = await Repository.find({
      userId: req.user._id,
    }).sort({
      updatedAt: -1,
    });

    return res.status(200).json({
      success: true,
      repositories,
    });
  } catch (error) {
    console.error("Get repositories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch repositories",
    });
  }
};

const getRepository = async (req, res) => {
  try {
    const { repoId } = req.params;

    const repository = await Repository.findOne({
      _id: repoId,
      userId: req.user._id,
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    return res.status(200).json({
      success: true,
      repository,
    });
  } catch (error) {
    console.error("Get repository error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch repository",
    });
  }
};

const updateRepository = async (req, res) => {
  try {
    const { repoId } = req.params;
    const { name, description } = req.body;

    const repository = await Repository.findOne({
      _id: repoId,
      userId: req.user._id,
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    if (name !== undefined) {
      repository.name = name.trim();
    }

    if (description !== undefined) {
      repository.description = description.trim();
    }

    await repository.save();

    return res.status(200).json({
      success: true,
      message: "Repository updated successfully",
      repository,
    });
  } catch (error) {
    console.error("Update repository error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update repository",
    });
  }
};

const deleteRepository = async (req, res) => {
  try {
    const { repoId } = req.params;

    const repository = await Repository.findOne({
      _id: repoId,
      userId: req.user._id,
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    // Delete all code files inside the repository
    await CodeFile.deleteMany({
      repositoryId: repoId,
      userId: req.user._id,
    });

    // Delete the repository
    await Repository.deleteOne({
      _id: repoId,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Repository deleted successfully",
    });
  } catch (error) {
    console.error("Delete repository error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete repository",
    });
  }
};

module.exports = {
  createRepository,
  getRepositories,
  getRepository,
  updateRepository,
  deleteRepository,
};