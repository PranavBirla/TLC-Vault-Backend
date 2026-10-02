const Repository = require("../models/repository.model");
const CodeFile = require("../models/codefile.model");
const User = require("../models/user.model");
const {
    getISTDate,
    getPreviousISTDate,
} = require("../utils/istDate");

/*
 * Get total repositories and code files for a user.
 */
const getDashboardTotals = async (userId) => {
    const [
        repositoryCount,
        codeFileCount,
    ] = await Promise.all([
        Repository.countDocuments({
            userId,
        }),

        CodeFile.countDocuments({
            userId,
        }),
    ]);

    return {
        repositories: repositoryCount,
        codeFiles: codeFileCount,
    };
};


/*
 * Get the user's code-file language breakdown.
 */
const getLanguageBreakdown = async (userId) => {
    const results = await CodeFile.aggregate([
        {
            $match: {
                userId,
                language: {
                    $exists: true,
                    $ne: "",
                },
            },
        },

        {
            $group: {
                _id: {
                    $toLower: {
                        $trim: {
                            input: "$language",
                        },
                    },
                },

                count: {
                    $sum: 1,
                },
            },
        },

        {
            $sort: {
                count: -1,
                _id: 1,
            },
        },
    ]);

    return results.map((item) => ({
        language: item._id,
        count: item.count,
    }));
};


/*
 * Get the user's most recently worked-on files
 * and repositories.
 *
 * "Recently worked-on" is currently represented
 * by updatedAt.
 */
const getContinueWork = async (userId) => {
    const [
        files,
        repositories,
    ] = await Promise.all([
        CodeFile.find({
            userId,
        })
            .select(
                "_id name language repositoryId updatedAt"
            )
            .sort({
                updatedAt: -1,
            })
            .limit(5)
            .populate({
                path: "repositoryId",
                select: "_id name",
            })
            .lean(),

        Repository.find({
            userId,
        })
            .select(
                "_id name updatedAt"
            )
            .sort({
                updatedAt: -1,
            })
            .limit(3)
            .lean(),
    ]);


    return {
        files: files.map((file) => ({
            id: file._id,
            name: file.name,
            language: file.language,

            repository: file.repositoryId
                ? {
                    id: file.repositoryId._id,
                    name: file.repositoryId.name,
                }
                : null,

            updatedAt: file.updatedAt,
        })),

        repositories: repositories.map((repository) => ({
            id: repository._id,
            name: repository.name,
            updatedAt: repository.updatedAt,
        })),
    };
};


/*
 * Get weekly activity using the data we already have.
 *
 * Current definition:
 *
 * - Week starts Monday 00:00 UTC.
 * - Week ends at the current time.
 * - An active day is a calendar day on which the
 *   user created or updated at least one repository
 *   or code file.
 *
 * This is a temporary derived metric.
 * The future Activity Ledger will provide a more
 * precise activity model.
 */
const getWeeklyActivity = async (userId) => {
    const now = new Date();

    /*
     * Calculate Monday 00:00 UTC for the current week.
     *
     * JavaScript:
     * Sunday = 0
     * Monday = 1
     * ...
     */
    const currentDay = now.getUTCDay();

    const daysSinceMonday =
        (currentDay + 6) % 7;

    const startOfWeek = new Date(now);

    startOfWeek.setUTCDate(
        now.getUTCDate() - daysSinceMonday
    );

    startOfWeek.setUTCHours(
        0,
        0,
        0,
        0
    );


    const dateFilter = {
        $gte: startOfWeek,
        $lte: now,
    };


    /*
     * We use one aggregation per collection.
     *
     * Each aggregation returns:
     *
     * - created count
     * - updated count
     * - distinct active days
     *
     * MongoDB performs the calculations server-side,
     * so we do not load all historical documents into Node.
     */
    const [
        repositoryActivity,
        codeFileActivity,
    ] = await Promise.all([
        Repository.aggregate([
            {
                $match: {
                    userId,

                    $or: [
                        { createdAt: dateFilter, },
                        { updatedAt: dateFilter, },
                    ],
                },
            },

            {
                $facet: {
                    created: [
                        {
                            $match: {
                                createdAt: dateFilter,
                            },
                        },

                        {
                            $count: "count",
                        },
                    ],

                    updated: [
                        {
                            $match: {
                                updatedAt: dateFilter,
                            },
                        },

                        {
                            $count: "count",
                        },
                    ],

                    activeDays: [
                        {
                            $project: {
                                activityDates: {
                                    $filter: {
                                        input: [
                                            "$createdAt",
                                            "$updatedAt",
                                        ],

                                        as: "date",

                                        cond: {
                                            $and: [
                                                {
                                                    $ne: [
                                                        "$$date",
                                                        null,
                                                    ],
                                                },

                                                {
                                                    $gte: [
                                                        "$$date",
                                                        startOfWeek,
                                                    ],
                                                },

                                                {
                                                    $lte: [
                                                        "$$date",
                                                        now,
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        },

                        {
                            $unwind: "$activityDates",
                        },

                        {
                            $project: {
                                day: {
                                    $dateToString: {
                                        format: "%Y-%m-%d",
                                        date: "$activityDates",
                                    },
                                },
                            },
                        },

                        {
                            $group: {
                                _id: "$day",
                            },
                        },
                    ],
                },
            },
        ]),

        CodeFile.aggregate([
            {
                $match: {
                    userId,

                    $or: [
                        {
                            createdAt: dateFilter,
                        },

                        {
                            updatedAt: dateFilter,
                        },
                    ],
                },
            },

            {
                $facet: {
                    created: [
                        {
                            $match: {
                                createdAt: dateFilter,
                            },
                        },

                        {
                            $count: "count",
                        },
                    ],

                    updated: [
                        {
                            $match: {
                                updatedAt: dateFilter,
                            },
                        },

                        {
                            $count: "count",
                        },
                    ],

                    activeDays: [
                        {
                            $project: {
                                activityDates: {
                                    $filter: {
                                        input: [
                                            "$createdAt",
                                            "$updatedAt",
                                        ],

                                        as: "date",

                                        cond: {
                                            $and: [
                                                {
                                                    $ne: [
                                                        "$$date",
                                                        null,
                                                    ],
                                                },

                                                {
                                                    $gte: [
                                                        "$$date",
                                                        startOfWeek,
                                                    ],
                                                },

                                                {
                                                    $lte: [
                                                        "$$date",
                                                        now,
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        },

                        {
                            $unwind: "$activityDates",
                        },

                        {
                            $project: {
                                day: {
                                    $dateToString: {
                                        format: "%Y-%m-%d",
                                        date: "$activityDates",
                                    },
                                },
                            },
                        },

                        {
                            $group: {
                                _id: "$day",
                            },
                        },
                    ],
                },
            },
        ]),
    ]);


    const repositoryResult =
        repositoryActivity[0] || {};

    const codeFileResult =
        codeFileActivity[0] || {};


    const repositoriesCreated =
        repositoryResult.created?.[0]?.count || 0;

    const repositoriesUpdated =
        repositoryResult.updated?.[0]?.count || 0;

    const codeFilesCreated =
        codeFileResult.created?.[0]?.count || 0;

    const codeFilesUpdated =
        codeFileResult.updated?.[0]?.count || 0;


    /*
     * Combine active days from both collections.
     *
     * We use a Set so the same calendar day only
     * counts once even if the user changed several files
     * and repositories on that day.
     */
    const activeDays = new Set([
        ...(repositoryResult.activeDays || []).map(
            (item) => item._id
        ),

        ...(codeFileResult.activeDays || []).map(
            (item) => item._id
        ),
    ]);


    return {
        activeDays: activeDays.size,

        codeFilesCreated,
        codeFilesUpdated,

        repositoriesCreated,
        repositoriesUpdated,
    };
};

const getStreakSummary = async (userId) => {
    const user = await User.findById(userId).select(
        "currentStreak longestStreak totalActiveDays lastActiveDate"
    );

    if (!user) {
        throw new Error(
            "User not found while fetching streak summary"
        );
    }

    const today = getISTDate();
    const yesterday = getPreviousISTDate(today);

    let currentStreak = user.currentStreak || 0;

    /*
     * A streak is considered active only when the
     * user's latest active date is today or yesterday.
     *
     * If the last activity is older than yesterday,
     * the current streak is broken.
     */
    if (
        user.lastActiveDate !== today &&
        user.lastActiveDate !== yesterday
    ) {
        currentStreak = 0;
    }

    return {
        currentStreak,
        longestStreak: user.longestStreak || 0,
        totalActiveDays: user.totalActiveDays || 0,
        lastActiveDate: user.lastActiveDate || null,
    };
};


/*
 * Main dashboard summary service.
 *
 * Each dashboard section has its own function.
 * The summary function only orchestrates them.
 */
const getDashboardSummary = async (userId) => {
    const [
        totals,
        streak,
        languages,
        continueWork,
        weeklyActivity,
    ] = await Promise.all([
        getDashboardTotals(userId),
        getStreakSummary(userId),
        getLanguageBreakdown(userId),
        getContinueWork(userId),
        getWeeklyActivity(userId),
    ]);

    return {
        totals,
        streak,
        languages,
        continueWork,
        weeklyActivity,
    };
};


module.exports = {
    getDashboardSummary,
};