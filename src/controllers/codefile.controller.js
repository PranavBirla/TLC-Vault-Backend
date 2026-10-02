const CodeFile = require("../models/codefile.model");
const Repository = require("../models/repository.model");

const {
  recordActivity,
} = require("../services/activity.service");


const createCodeFile = async (req, res) => {
  try {
    const { repoId } = req.params;
    const {
      name,
      language,
      code,
      description,
    } = req.body;


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


    /*
     * Create the code file first.
     *
     * Activity is recorded only after this succeeds,
     * so failed code-file creation never creates activity.
     */
    const codeFile = await CodeFile.create({
      repositoryId: repoId,
      userId: req.user._id,
      name: name.trim(),
      language: language.trim().toLowerCase(),
      code: code || "",
      description: description?.trim() || "",
    });


    /*
     * Record meaningful user activity.
     *
     * Activity tracking is intentionally treated as a
     * secondary operation. If it fails, the successful
     * code-file creation must not be rolled back.
     */
    try {
      await recordActivity(req.user._id);
    } catch (activityError) {
      console.error(
        "Record activity after code file creation error:",
        activityError
      );
    }


    return res.status(201).json({
      success: true,
      message: "Code file created successfully",
      codeFile,
    });

  } catch (error) {
    console.error(
      "Create code file error:",
      error
    );

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
    console.error(
      "Get code files error:",
      error
    );

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
    console.error(
      "Get code file error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch code file",
    });
  }
};


const updateCodeFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const {
      name,
      language,
      code,
      description,
    } = req.body;


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


    /*
     * Apply incoming changes.
     *
     * Mongoose will track which fields actually changed.
     */
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


    /*
     * Check whether the document was genuinely changed.
     *
     * This prevents a simple "Save" operation with identical
     * data from being counted as meaningful activity.
     */
    const hasChanges = codeFile.isModified();


    /*
     * Save only when something actually changed.
     *
     * Apart from avoiding unnecessary database work, this
     * keeps updatedAt meaningful for the dashboard.
     */
    if (hasChanges) {
      await codeFile.save();


      /*
       * The core operation succeeded.
       *
       * Activity tracking is secondary. If it fails, the
       * user's successfully saved code must remain intact.
       */
      try {
        await recordActivity(req.user._id);
      } catch (activityError) {
        console.error(
          "Record activity after code file update error:",
          activityError
        );
      }
    }


    return res.status(200).json({
      success: true,
      message: hasChanges
        ? "Code file updated successfully"
        : "No changes detected",
      codeFile,
    });

  } catch (error) {
    console.error(
      "Update code file error:",
      error
    );

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
    console.error(
      "Delete code file error:",
      error
    );

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