const User = require("../models/user.model");
const Repository = require("../models/repository.model");
const CodeFile = require("../models/codefile.model");
const Feedback = require("../models/feedback.model");

const getAdminStats = async (req, res) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [
            totalUsers,
            usersToday,
            loginsToday,
            totalRepositories,
            repositoriesToday,
            totalCodeFiles,
            codeFilesToday,
        ] = await Promise.all([
            User.countDocuments(),

            User.countDocuments({
                createdAt: {
                    $gte: startOfToday,
                },
            }),

            User.countDocuments({
                lastLoginAt: {
                    $gte: startOfToday,
                },
            }),

            Repository.countDocuments(),

            Repository.countDocuments({
                createdAt: {
                    $gte: startOfToday,
                },
            }),

            CodeFile.countDocuments(),

            CodeFile.countDocuments({
                createdAt: {
                    $gte: startOfToday,
                },
            }),
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    today: usersToday,
                },

                logins: {
                    today: loginsToday,
                },

                repositories: {
                    total: totalRepositories,
                    today: repositoriesToday,
                },

                codeFiles: {
                    total: totalCodeFiles,
                    today: codeFilesToday,
                },
            },
        });
    } catch (error) {
        console.error("Admin stats error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch admin stats",
        });
    }
};

const getAdminUsers = async (req, res) => {
  try {
    const requestedLimit = req.query.limit || "30";

    let usersQuery = User.find()
      .select("_id name email role createdAt lastLoginAt")
      .sort({ createdAt: -1 });

    if (requestedLimit !== "all") {
      const limit = Number.parseInt(requestedLimit, 10);

      if (!Number.isInteger(limit) || limit < 1) {
        return res.status(400).json({
          success: false,
          message: "Limit must be a positive number or all",
        });
      }

      usersQuery = usersQuery.limit(limit);
    }

    const [users, totalUsers] = await Promise.all([
      usersQuery.lean(),
      User.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      users,
      totalUsers,
      showing: users.length,
    });
  } catch (error) {
    console.error("Admin users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

const getAdminRepositories = async (req, res) => {
  try {
    const requestedLimit = req.query.limit || "30";

    let repositoriesQuery = Repository.find()
      .select("_id name description userId createdAt updatedAt")
      .populate("userId", "_id name email")
      .sort({ createdAt: -1 });

    if (requestedLimit !== "all") {
      const limit = Number.parseInt(requestedLimit, 10);

      if (!Number.isInteger(limit) || limit < 1) {
        return res.status(400).json({
          success: false,
          message: "Limit must be a positive number or all",
        });
      }

      repositoriesQuery = repositoriesQuery.limit(limit);
    }

    const [repositories, totalRepositories] =
      await Promise.all([
        repositoriesQuery.lean(),
        Repository.countDocuments(),
      ]);

    return res.status(200).json({
      success: true,
      repositories,
      totalRepositories,
      showing: repositories.length,
    });
  } catch (error) {
    console.error(
      "Admin repositories error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch repositories",
    });
  }
};

const getAdminCodeFiles = async (req, res) => {
  try {
    const requestedLimit = req.query.limit || "30";

    let codeFilesQuery = CodeFile.find()
      .select(
        "_id name language description repositoryId userId createdAt updatedAt"
      )
      .populate("userId", "_id name email")
      .populate("repositoryId", "_id name")
      .sort({ createdAt: -1 });

    if (requestedLimit !== "all") {
      const limit = Number.parseInt(requestedLimit, 10);

      if (!Number.isInteger(limit) || limit < 1) {
        return res.status(400).json({
          success: false,
          message: "Limit must be a positive number or all",
        });
      }

      codeFilesQuery = codeFilesQuery.limit(limit);
    }

    const [codeFiles, totalCodeFiles] =
      await Promise.all([
        codeFilesQuery.lean(),
        CodeFile.countDocuments(),
      ]);

    return res.status(200).json({
      success: true,
      codeFiles,
      totalCodeFiles,
      showing: codeFiles.length,
    });
  } catch (error) {
    console.error(
      "Admin code files error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch code files",
    });
  }
};

const getAdminAnalytics = async (req, res) => {
  try {
    const days = 30;

    const today = new Date();

    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    const buildDailyData = async (Model) => {
      const results = await Model.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: today,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

      const resultMap = new Map(
        results.map((item) => [
          item._id,
          item.count,
        ])
      );

      const dailyData = [];

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        const key = date.toISOString().split("T")[0];

        dailyData.push({
          date: key,
          count: resultMap.get(key) || 0,
        });
      }

      return dailyData;
    };

    const [users, repositories, codeFiles] =
      await Promise.all([
        buildDailyData(User),
        buildDailyData(Repository),
        buildDailyData(CodeFile),
      ]);

    return res.status(200).json({
      success: true,
      range: {
        days,
        start: startDate,
        end: today,
      },
      analytics: {
        users,
        repositories,
        codeFiles,
      },
    });
  } catch (error) {
    console.error(
      "Get admin analytics error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin analytics",
    });
  }
};

const getAdminFeedback = async (req, res) => {
  try {
    const {
      limit = "30",
      type,
      status,
    } = req.query;

    const filter = {};

    // Optional filter: feedback or issue
    if (type) {
      if (!["feedback", "issue"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid type. Use feedback or issue.",
        });
      }

      filter.type = type;
    }

    // Optional filter: submission status
    if (status) {
      if (!["new", "reviewing", "resolved", "closed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status.",
        });
      }

      filter.status = status;
    }

    let feedbackQuery = Feedback.find(filter)
      .select(
        "_id userId type category message steps status createdAt updatedAt"
      )
      .populate("userId", "_id name email")
      .sort({ createdAt: -1 });

    if (limit !== "all") {
      const parsedLimit = Number.parseInt(limit, 10);

      if (
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Limit must be between 1 and 100, or all.",
        });
      }

      feedbackQuery = feedbackQuery.limit(parsedLimit);
    }

    const [feedback, totalFeedback, newFeedback, newIssues] =
      await Promise.all([
        feedbackQuery.lean(),
        Feedback.countDocuments(filter),
        Feedback.countDocuments({
          ...filter,
          type: "feedback",
          status: "new",
        }),
        Feedback.countDocuments({
          ...filter,
          type: "issue",
          status: "new",
        }),
      ]);

    return res.status(200).json({
      success: true,
      feedback,
      totalFeedback,
      showing: feedback.length,
      summary: {
        newFeedback,
        newIssues,
      },
    });
  } catch (error) {
    console.error("Admin feedback error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback.",
    });
  }
};

const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "new",
      "reviewing",
      "resolved",
      "closed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback status.",
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { $set: { status } },
      {
        new: true,
        runValidators: true,
      }
    )
      .select(
        "_id userId type category message steps status createdAt updatedAt"
      )
      .populate("userId", "_id name email");

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback submission not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback status updated successfully.",
      feedback,
    });
  } catch (error) {
    console.error("Update feedback status error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update feedback status.",
    });
  }
};

module.exports = {
    getAdminStats,
    getAdminUsers,
    getAdminRepositories,
    getAdminCodeFiles,
    getAdminAnalytics,
    getAdminFeedback,
    updateFeedbackStatus,
};