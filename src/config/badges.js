const BADGE_DEFINITIONS = [
  {
    key: "boot_sequence",
    name: "Boot Sequence",

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
    key: "loop_locked",
    name: "Loop Locked",

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
    key: "steady_commit",
    name: "Steady Commit",

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
    key: "persistent_process",
    name: "Persistent Process",

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
    name: "Vaultbound",

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
    key: "unbroken_chain",
    name: "Unbroken Chain",

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