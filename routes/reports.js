const express = require("express");
const {
  findreports,
  getLiveReport,
  getDailyReport,
  getDateRangeReport,
  getTodayCheckoutReport,
} = require("../controllers/ReportsControllers");
const router = express.Router();

router.post("/", findreports);
router.get("/live-report", getLiveReport);
router.get("/daily-report", getDailyReport);
router.get("/filter-report", getDateRangeReport )
router.get("/today-checkout-report", getTodayCheckoutReport)

module.exports = router;
