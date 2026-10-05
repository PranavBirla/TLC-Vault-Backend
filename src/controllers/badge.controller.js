const {
  getUserBadges,
} = require("../services/badge.service");

const getUserBadgesController = async (
  req,
  res
) => {
  try {
    const result = await getUserBadges(
      req.user._id
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "Get user badges error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch badges",
    });
  }
};

module.exports = {
  getUserBadgesController,
};