const mongoose = require("mongoose");
const User = require("../models/user.model");
const { getPreviousISTDate } = require("../utils/istDate");

const updateStreak = async (
  userId,
  activityDate
) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new TypeError(
      "Invalid user ID supplied to updateStreak()"
    );
  }

  const previousDate =
    getPreviousISTDate(activityDate);

  /*
   * Only update streak information when this
   * is a new active day for the user.
   *
   * Multiple coding actions on the same day
   * must not increase the streak multiple times.
   */
  const updatedUser =
    await User.findOneAndUpdate(
      {
        _id: userId,
        lastActiveDate: {
          $ne: activityDate,
        },
      },
      [
        {
          $set: {
            totalActiveDays: {
              $add: [
                {
                  $ifNull: [
                    "$totalActiveDays",
                    0,
                  ],
                },
                1,
              ],
            },

            currentStreak: {
              $cond: [
                {
                  $eq: [
                    "$lastActiveDate",
                    previousDate,
                  ],
                },
                {
                  $add: [
                    {
                      $ifNull: [
                        "$currentStreak",
                        0,
                      ],
                    },
                    1,
                  ],
                },
                1,
              ],
            },

            lastActiveDate: activityDate,
          },
        },

        {
          $set: {
            longestStreak: {
              $max: [
                {
                  $ifNull: [
                    "$longestStreak",
                    0,
                  ],
                },
                "$currentStreak",
              ],
            },
          },
        },
      ],
      {
        returnDocument: "after",
        updatePipeline: true,
      }
    );

  /*
   * If no document was updated, it means
   * this user already had activity recorded
   * for this same IST date.
   */
  if (!updatedUser) {
    const existingUser =
      await User.findById(userId).select(
        "currentStreak longestStreak totalActiveDays lastActiveDate"
      );

    if (!existingUser) {
      throw new Error(
        "User not found while updating streak"
      );
    }

    return {
      currentStreak:
        existingUser.currentStreak,
      longestStreak:
        existingUser.longestStreak,
      totalActiveDays:
        existingUser.totalActiveDays,
      lastActiveDate:
        existingUser.lastActiveDate,
    };
  }

  return {
    currentStreak:
      updatedUser.currentStreak,
    longestStreak:
      updatedUser.longestStreak,
    totalActiveDays:
      updatedUser.totalActiveDays,
    lastActiveDate:
      updatedUser.lastActiveDate,
  };
};

module.exports = {
  updateStreak,
};