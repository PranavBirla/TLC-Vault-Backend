const mongoose = require("mongoose");
const ActivityDay = require("../models/activityDay.model");
const { getISTDate } = require("../utils/istDate");
const { updateStreak } = require("./streak.service");

const recordActivity = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new TypeError(
      "Invalid user ID supplied to recordActivity()"
    );
  }

  const now = new Date();
  const activityDate = getISTDate(now);

  const activityDay =
    await ActivityDay.findOneAndUpdate(
      {
        userId,
        activityDate,
      },
      {
        $setOnInsert: {
          userId,
          activityDate,
          firstActivityAt: now,
        },
        $set: {
          lastActivityAt: now,
        },
        $inc: {
          activityCount: 1,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

  const streak = await updateStreak(
    userId,
    activityDate
  );

  return {
    id: activityDay._id,
    activityDate: activityDay.activityDate,
    activityCount: activityDay.activityCount,
    firstActivityAt: activityDay.firstActivityAt,
    lastActivityAt: activityDay.lastActivityAt,
    streak,
  };
};

module.exports = {
  recordActivity,
};