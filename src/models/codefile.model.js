const mongoose = require("mongoose");

const codeFileSchema = new mongoose.Schema(
  {
    repositoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 150,
    },

    language: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 30,
    },

    code: {
      type: String,
      required: true,
      default: "",
      maxlength: 500000,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CodeFile", codeFileSchema);