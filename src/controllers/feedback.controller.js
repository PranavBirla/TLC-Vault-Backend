const Feedback = require("../models/feedback.model");

const feedbackCategories = [
  "Feature Request",
  "User Experience",
  "General Feedback",
  "Other",
];

const issueCategories = [
  "Bug",
  "Performance",
  "UI / Design",
  "Other",
];

const submitFeedback = async (req, res) => {
  try {
    const { type, category, message, steps = "" } = req.body;

    // Validate submission type
    if (!["feedback", "issue"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission type.",
      });
    }

    // Validate category against the permitted values
    const allowedCategories =
      type === "feedback" ? feedbackCategories : issueCategories;

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid category.",
      });
    }

    // Validate message
    if (
      typeof message !== "string" ||
      message.trim().length < 10 ||
      message.trim().length > 3000
    ) {
      return res.status(400).json({
        success: false,
        message: "Message must be between 10 and 3000 characters.",
      });
    }

    // Validate optional reproduction steps
    if (
      typeof steps !== "string" ||
      steps.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Steps must not exceed 2000 characters.",
      });
    }

    // Reproduction steps apply only to issue reports
    const feedback = await Feedback.create({
      userId: req.user._id,
      type,
      category,
      message: message.trim(),
      steps: type === "issue" ? steps.trim() : "",
    });

    return res.status(201).json({
      success: true,
      message:
        type === "issue"
          ? "Your issue report has been received."
          : "Your feedback has been received.",
      feedback: {
        id: feedback._id,
        type: feedback.type,
        status: feedback.status,
        createdAt: feedback.createdAt,
      },
    });
  } catch (error) {
    console.error("Submit feedback error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit your feedback. Please try again.",
    });
  }
};

module.exports = {
  submitFeedback,
};