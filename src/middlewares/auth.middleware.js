const User = require("../models/user.model");
const Session = require("../models/session.model");

const { hashToken } = require("../utils/session");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.tlc_session;

    // No session cookie
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const tokenHash = hashToken(token);

    // Find valid session
    const session = await Session.findOne({
      tokenHash,
      expiresAt: {
        $gt: new Date(),
      },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session expired or invalid",
      });
    }

    // Find the user associated with the session
    const user = await User.findById(session.userId).select(
      "_id name email role"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user to request
    req.user = user;

    // Continue to controller
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

module.exports = authMiddleware;