const mongoose = require("mongoose");

const activityDaySchema = new mongoose.Schema(
  {

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    activityDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    
    firstActivityAt: {
      type: Date,
      required: true,
    },

    lastActivityAt: {
      type: Date,
      required: true,
    },

    activityCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);



activityDaySchema.index(
  {
    userId: 1,
    activityDate: 1,
  },
  {
    unique: true,
  }
);

activityDaySchema.index({
  userId: 1,
  activityDate: -1,
});


module.exports = mongoose.model(
  "ActivityDay",
  activityDaySchema
);