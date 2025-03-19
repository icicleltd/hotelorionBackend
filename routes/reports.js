const express = require("express");
const {
  findreports,
  getLiveReport,
  getDailyReport,
} = require("../controllers/ReportsControllers");
const router = express.Router();

router.post("/", findreports);
router.get("/live-report", getLiveReport);
router.get("/daily-report", getDailyReport);

module.exports = router;
