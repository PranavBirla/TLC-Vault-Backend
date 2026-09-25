const User = require("../models/user.model");
const Repository = require("../models/repository.model");
const CodeFile = require("../models/codefile.model");

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
        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || 20, 1),
            100
        );

        const users = await User.find()
            .select("_id name email role createdAt lastLoginAt")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return res.status(200).json({
            success: true,
            users,
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
    const limit = Math.min(
      Math.max(parseInt(req.query.limit) || 20, 1),
      100
    );

    const repositories = await Repository.find()
      .select("_id name description userId createdAt updatedAt")
      .populate("userId", "_id name email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      repositories,
    });
  } catch (error) {
    console.error("Admin repositories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch repositories",
    });
  }
};

const getAdminCodeFiles = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit) || 20, 1),
      100
    );

    const codeFiles = await CodeFile.find()
      .select(
        "_id name language description repositoryId userId createdAt updatedAt"
      )
      .populate("userId", "_id name email")
      .populate("repositoryId", "_id name")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      codeFiles,
    });
  } catch (error) {
    console.error("Admin code files error:", error);

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

module.exports = {
    getAdminStats,
    getAdminUsers,
    getAdminRepositories,
    getAdminCodeFiles,
    getAdminAnalytics,
};