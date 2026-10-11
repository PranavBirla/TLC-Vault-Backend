const BADGE_DEFINITIONS = [
  {
    key: "booted",
    name: "BOOTED",

    description:
      "Complete your first meaningful coding day in TLC Vault.",

    category: "first_use",

    requirement: {
      type: "active_days",
      value: 1,
    },

    tier: "bronze",

    sortOrder: 1,
  },

  {
    key: "looped",
    name: "LOOPED",

    description:
      "Maintain a 3-day coding streak.",

    category: "streak",

    requirement: {
      type: "streak",
      value: 3,
    },

    tier: "bronze",

    sortOrder: 2,
  },

  {
    key: "commited",
    name: "COMMITED",

    description:
      "Reach 10 different active coding days.",

    category: "consistency",

    requirement: {
      type: "active_days",
      value: 10,
    },

    tier: "silver",

    sortOrder: 3,
  },

  {
    key: "persistent",
    name: "PERSISTENT",

    description:
      "Maintain a 7-day coding streak.",

    category: "streak",

    requirement: {
      type: "streak",
      value: 7,
    },

    tier: "silver",

    sortOrder: 4,
  },

  {
    key: "vaultbound",
    name: "VAULTBOUND",

    description:
      "Reach 30 different active coding days.",

    category: "consistency",

    requirement: {
      type: "active_days",
      value: 30,
    },

    tier: "gold",

    sortOrder: 5,
  },

  {
    key: "unbroken",
    name: "UNBROKEN",

    description:
      "Maintain a 14-day coding streak.",

    category: "streak",

    requirement: {
      type: "streak",
      value: 14,
    },

    tier: "gold",

    sortOrder: 6,
  },
];

const getBadgeDefinition = (key) => {
  return BADGE_DEFINITIONS.find(
    (badge) => badge.key === key
  );
};

module.exports = {
  BADGE_DEFINITIONS,
  getBadgeDefinition,
};