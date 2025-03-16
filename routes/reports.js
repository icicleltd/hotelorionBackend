const express = require("express");
const { findreports, getLiveReport } = require("../controllers/ReportsControllers");
const router = express.Router();

router.post("/", findreports);
router.get("/live-report", getLiveReport)

module.exports = router;
