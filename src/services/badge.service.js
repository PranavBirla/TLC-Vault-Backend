const mongoose = require("mongoose");
const UserBadge = require("../models/userBadge.model");
const { BADGE_DEFINITIONS } = require("../config/badges");
const User = require("../models/user.model");

const awardEligibleBadges = async (
  userId,
  {
    totalActiveDays = 0,
    longestStreak = 0,
  } = {}
) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new TypeError(
      "Invalid user ID supplied to awardEligibleBadges()"
    );
  }

  const eligibleBadges =
    BADGE_DEFINITIONS.filter((badge) => {
      const {
        type,
        value,
      } = badge.requirement;

      if (type === "active_days") {
        return totalActiveDays >= value;
      }

      if (type === "streak") {
        return longestStreak >= value;
      }

      return false;
    });

  if (eligibleBadges.length === 0) {
    return [];
  }

  const newlyAwarded = [];

  /*
   * Each badge is independently upserted.
   *
   * If the badge already exists for this user,
   * nothing is changed.
   *
   * If it doesn't exist, a new UserBadge
   * document is created.
   */
  for (const badge of eligibleBadges) {
    const result = await UserBadge.updateOne(
      {
        userId,
        badgeKey: badge.key,
      },
      {
        $setOnInsert: {
          userId,
          badgeKey: badge.key,
          unlockedAt: new Date(),
        },
      },
      {
        upsert: true,
      }
    );

    if (result.upsertedCount === 1) {
      newlyAwarded.push(badge);
    }
  }

  return newlyAwarded;
};

const getUserBadges = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new TypeError(
      "Invalid user ID supplied to getUserBadges()"
    );
  }

  const [user, userBadges] = await Promise.all([
    User.findById(userId).select(
      "totalActiveDays longestStreak"
    ),

    UserBadge.find({
      userId,
    })
      .select("badgeKey unlockedAt")
      .lean(),
  ]);

  if (!user) {
    throw new Error(
      "User not found while fetching badges"
    );
  }

  const unlockedMap = new Map(
    userBadges.map((badge) => [
      badge.badgeKey,
      badge.unlockedAt,
    ])
  );

  const badges = BADGE_DEFINITIONS.map((badge) => {
    const {
      type,
      value,
    } = badge.requirement;

    let currentProgress = 0;

    if (type === "active_days") {
      currentProgress =
        user.totalActiveDays || 0;
    }

    if (type === "streak") {
      currentProgress =
        user.longestStreak || 0;
    }

    const percentage = Math.min(
      Math.round(
        (currentProgress / value) * 100
      ),
      100
    );

    const unlocked =
      unlockedMap.has(badge.key);

    return {
      key: badge.key,
      name: badge.name,
      description: badge.description,
      category: badge.category,
      tier: badge.tier,

      requirement: {
        type,
        value,
      },

      unlocked,

      unlockedAt:
        unlockedMap.get(badge.key) || null,

      progress: {
        current: currentProgress,
        required: value,
        percentage,
      },

      sortOrder: badge.sortOrder,
    };
  });

  const unlockedCount = badges.filter(
    (badge) => badge.unlocked
  ).length;

  return {
    summary: {
      total: badges.length,
      unlocked: unlockedCount,
      locked:
        badges.length - unlockedCount,
    },

    badges: badges.sort(
      (a, b) => a.sortOrder - b.sortOrder
    ),
  };
};

module.exports = {
  awardEligibleBadges,
  getUserBadges,
};