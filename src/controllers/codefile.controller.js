const CodeFile = require("../models/codefile.model");
const Repository = require("../models/repository.model");

const createCodeFile = async (req, res) => {
  try {
    const { repoId } = req.params;
    const { name, language, code, description } = req.body;

    // Check whether repository belongs to logged-in user
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

    if (!name || !language) {
      return res.status(400).json({
        success: false,
        message: "Name and language are required",
      });
    }

    const codeFile = await CodeFile.create({
      repositoryId: repoId,
      userId: req.user._id,
      name: name.trim(),
      language: language.trim().toLowerCase(),
      code: code || "",
      description: description?.trim() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Code file created successfully",
      codeFile,
    });
  } catch (error) {
    console.error("Create code file error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create code file",
    });
  }
};

const getCodeFiles = async (req, res) => {
  try {
    const { repoId } = req.params;

    // Make sure repository belongs to logged-in user
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

    const codeFiles = await CodeFile.find({
      repositoryId: repoId,
      userId: req.user._id,
    }).sort({
      updatedAt: -1,
    });

    return res.status(200).json({
      success: true,
      codeFiles,
    });
  } catch (error) {
    console.error("Get code files error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch code files",
    });
  }
};

const getCodeFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const codeFile = await CodeFile.findOne({
      _id: fileId,
      userId: req.user._id,
    });

    if (!codeFile) {
      return res.status(404).json({
        success: false,
        message: "Code file not found",
      });
    }

    return res.status(200).json({
      success: true,
      codeFile,
    });
  } catch (error) {
    console.error("Get code file error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch code file",
    });
  }
};

const updateCodeFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { name, language, code, description } = req.body;

    const codeFile = await CodeFile.findOne({
      _id: fileId,
      userId: req.user._id,
    });

    if (!codeFile) {
      return res.status(404).json({
        success: false,
        message: "Code file not found",
      });
    }

    if (name !== undefined) {
      codeFile.name = name.trim();
    }

    if (language !== undefined) {
      codeFile.language = language.trim().toLowerCase();
    }

    if (code !== undefined) {
      codeFile.code = code;
    }

    if (description !== undefined) {
      codeFile.description = description.trim();
    }

    await codeFile.save();

    return res.status(200).json({
      success: true,
      message: "Code file updated successfully",
      codeFile,
    });
  } catch (error) {
    console.error("Update code file error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update code file",
    });
  }
};

const deleteCodeFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const codeFile = await CodeFile.findOneAndDelete({
      _id: fileId,
      userId: req.user._id,
    });

    if (!codeFile) {
      return res.status(404).json({
        success: false,
        message: "Code file not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Code file deleted successfully",
    });
  } catch (error) {
    console.error("Delete code file error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete code file",
    });
  }
};

module.exports = {
  createCodeFile,
  getCodeFiles,
  getCodeFile,
  updateCodeFile,
  deleteCodeFile,
};