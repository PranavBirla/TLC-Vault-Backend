const mongoose = require("mongoose");
const ActivityDay = require("../models/activityDay.model");
const { getISTDate } = require("../utils/istDate");
const { updateStreak } = require("./streak.service");
const { awardEligibleBadges, } = require("./badge.service");

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
        returnDocument: "after",
        runValidators: true,
      }
    );

  const streak = await updateStreak(
    userId,
    activityDate
  );

  let newlyUnlockedBadges = [];

  /*
   * Badge awarding is intentionally best-effort.
   *
   * A badge failure must never break the user's
   * code-saving or activity-recording operation.
   */

  try {
    newlyUnlockedBadges =
      await awardEligibleBadges(
        userId,
        {
          totalActiveDays:
            streak.totalActiveDays,
          longestStreak:
            streak.longestStreak,
        }
      );
  } catch (badgeError) {
    console.error(
      "Award badges after activity error:",
      badgeError
    );
  }

  return {
    id: activityDay._id,
    activityDate: activityDay.activityDate,
    activityCount: activityDay.activityCount,
    firstActivityAt: activityDay.firstActivityAt,
    lastActivityAt: activityDay.lastActivityAt,
    streak,
    newlyUnlockedBadges,
  };
};

module.exports = {
  recordActivity,
};