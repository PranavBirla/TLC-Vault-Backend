const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../models/user.model");
const Session = require("../models/session.model");

const { generateSessionToken, hashToken } = require("../utils/session");
const { sendVerificationEmail,sendPasswordResetEmail, } = require("../services/email.service");

const SESSION_DURATION = 1000 * 60 * 60 * 4; // 4 hours
const VERIFICATION_EXPIRY = 1000 * 60 * 30; // 30 minutes
const RESEND_COOLDOWN = 1000 * 30; // 30 seconds
const PASSWORD_RESET_EXPIRY = 1000 * 60 * 30; // 30 minutes

const createSession = async (req, user, res) => {
  const token = generateSessionToken();

  await Session.create({
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + SESSION_DURATION),
    userAgent: req.headers["user-agent"],
  });

  res.cookie("tlc_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: SESSION_DURATION,
  });
};

const createVerificationToken = async (user) => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  user.emailVerificationTokenHash = hashToken(rawToken);
  user.emailVerificationExpiresAt = new Date(
    Date.now() + VERIFICATION_EXPIRY
  );

  await user.save();

  return rawToken;
};

const sendVerificationForUser = async (user) => {
  const rawToken = await createVerificationToken(user);

  await sendVerificationEmail({
    name: user.name,
    email: user.email,
    token: rawToken,
  });
};


// REGISTER
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      emailVerified: false,
      emailVerifiedAt: null,
    });

    try {
      await sendVerificationForUser(user);
    } catch (emailError) {
      console.error("Verification email error:", emailError);

      return res.status(201).json({
        message: "Account created, but the verification email could not be sent.",
        verificationRequired: true,
        emailSent: false,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    }

    return res.status(201).json({
      message: "Account created successfully",
      verificationRequired: true,
      emailSent: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};


// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.emailVerified === false) {
      return res.status(403).json({
        code: "EMAIL_NOT_VERIFIED",
        message: "Your email hasn't been verified yet.",
        email: user.email,
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    await createSession(req, user, res);

    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};


// VERIFY EMAIL
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        code: "INVALID_VERIFICATION_TOKEN",
        message: "This verification link is invalid or has expired.",
      });
    }

    const tokenHash = hashToken(token);

    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
    });

    if (!user) {
      return res.status(400).json({
        code: "INVALID_VERIFICATION_TOKEN",
        message: "This verification link is invalid or has expired.",
      });
    }

    if (user.emailVerified === true) {
      return res.status(200).json({
        code: "ALREADY_VERIFIED",
        message: "Your TLC Vault account is already active.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    if (
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt.getTime() < Date.now()
    ) {
      return res.status(400).json({
        code: "VERIFICATION_TOKEN_EXPIRED",
        message: "This verification link is invalid or has expired.",
      });
    }

    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;

    await user.save();

    await createSession(req, user, res);

    return res.status(200).json({
      code: "VERIFIED",
      message: "Email verified successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Verify email error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};


// RESEND VERIFICATION
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Keep the response generic for unknown addresses.
    if (!user) {
      return res.status(200).json({
        message: "If an account exists with that email, a verification email will be sent.",
      });
    }

    if (user.emailVerified !== false) {
      return res.status(200).json({
        message: "Your email is already verified.",
        alreadyVerified: true,
      });
    }

    const lastSentAt = user.emailVerificationExpiresAt
      ? user.emailVerificationExpiresAt.getTime() - VERIFICATION_EXPIRY
      : 0;

    if (lastSentAt && Date.now() - lastSentAt < RESEND_COOLDOWN) {
      const retryAfter = Math.ceil(
        (RESEND_COOLDOWN - (Date.now() - lastSentAt)) / 1000
      );

      return res.status(429).json({
        code: "RESEND_COOLDOWN",
        message: `Please wait ${retryAfter} seconds before requesting another email.`,
        retryAfter,
      });
    }

    try {
      await sendVerificationForUser(user);
    } catch (emailError) {
      console.error("Resend verification email error:", emailError);

      return res.status(503).json({
        message: "We couldn't send the verification email right now. Please try again.",
      });
    }

    return res.status(200).json({
      message: "Verification email sent",
    });
  } catch (error) {
    console.error("Resend verification error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};


// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  const genericResponse = {
    message:
      "If an account exists with that email, a password reset link will be sent.",
  };

  try {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Do not reveal whether an account exists.
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Generate a cryptographically secure token.
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store only its hash in MongoDB.
    user.passwordResetTokenHash = hashToken(rawToken);
    user.passwordResetExpiresAt = new Date(
      Date.now() + PASSWORD_RESET_EXPIRY
    );

    await user.save();

    try {
      await sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        token: rawToken,
      });
    } catch (emailError) {
      console.error("Password reset email error:", emailError);

      // Invalidate the token if the email could not be sent.
      user.passwordResetTokenHash = null;
      user.passwordResetExpiresAt = null;

      await user.save();
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
};


// RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (
      typeof token !== "string" ||
      !token ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        code: "INVALID_RESET_REQUEST",
        message: "A reset token and new password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    // Hash the token to match the value stored in MongoDB.
    const tokenHash = hashToken(token);
    const now = new Date();

    // Find a user with a valid, unexpired reset token.
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: now },
    });

    if (!user) {
      return res.status(400).json({
        code: "INVALID_OR_EXPIRED_RESET_TOKEN",
        message:
          "This password reset link is invalid or has expired. Please request a new one.",
      });
    }

    // Hash the new password using the existing bcrypt configuration.
    const passwordHash = await bcrypt.hash(password, 12);

    // Update only if the token is still valid.
    // This also prevents the same token from being reused.
    const result = await User.updateOne(
      {
        _id: user._id,
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: new Date() },
      },
      {
        $set: {
          passwordHash,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
      }
    );

    if (result.modifiedCount !== 1) {
      return res.status(400).json({
        code: "INVALID_OR_EXPIRED_RESET_TOKEN",
        message:
          "This password reset link is invalid or has expired. Please request a new one.",
      });
    }

    // Invalidate every existing session for this user.
    await Session.deleteMany({
      userId: user._id,
    });

    // Clear the current browser's session cookie as well.
    res.clearCookie("tlc_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
};


// LOGOUT
const logout = async (req, res) => {
  try {
    const token = req.cookies.tlc_session;

    if (token) {
      await Session.deleteOne({
        tokenHash: hashToken(token),
      });
    }

    res.clearCookie("tlc_session");

    res.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    res.status(500).json({
      message: "Something went wrong",
    });
  }
};


// GET-ME
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        emailVerified: req.user.emailVerified,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


// UPDATE USER PROFILE
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate input
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    const trimmedName = name.trim();

    // Validate name length
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 50 characters.",
      });
    }

    // Find authenticated user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Update only the name
    user.name = trimmedName;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating your profile.",
    });
  }
};


module.exports = {
  register,
  login,
  updateProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  logout,
  getMe,
};
