const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    emailVerified: {
      type: Boolean,
      default: true,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    emailVerificationTokenHash: {
      type: String,
      default: null,
    },

    emailVerificationExpiresAt: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    }

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);