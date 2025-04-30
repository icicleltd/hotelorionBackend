const express = require("express");
const {
  findreports,
  getLiveReport,
  getDailyReport,
  getDateRangeReport,
} = require("../controllers/ReportsControllers");
const router = express.Router();

router.post("/", findreports);
router.get("/live-report", getLiveReport);
router.get("/daily-report", getDailyReport);
router.get("/filter-report", getDateRangeReport )

module.exports = router;
