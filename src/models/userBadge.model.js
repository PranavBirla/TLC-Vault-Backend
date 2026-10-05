const mongoose = require("mongoose");

const userBadgeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    badgeKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    unlockedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  }
);

userBadgeSchema.index(
  {
    userId: 1,
    badgeKey: 1,
  },
  {
    unique: true,
  }
);

userBadgeSchema.index({
  userId: 1,
  unlockedAt: -1,
});

module.exports = mongoose.model(
  "UserBadge",
  userBadgeSchema
);