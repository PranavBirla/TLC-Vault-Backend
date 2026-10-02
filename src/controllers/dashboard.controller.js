const {
    getDashboardSummary,
} = require("../services/dashboard.service");


const getDashboardSummaryController = async (req, res) => {
    try {
        const userId = req.user._id;

        const summary = await getDashboardSummary(userId);

        return res.status(200).json({
            success: true,
            summary,
        });

    } catch (error) {
        console.error(
            "Get dashboard summary error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard summary",
        });
    }
};


module.exports = {
    getDashboardSummaryController,
};