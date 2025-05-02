const express = require("express");
const {
  createGenerateReport,
  getGenerateReport,
  getSingleGenerateReport,
} = require("./generateReport.controller");

const router = express.Router();

// Create a new extra payment
router.post("/create", createGenerateReport);
router.get("/generated-report", getGenerateReport);
router.get("/generated-report/:id", getSingleGenerateReport);

const GenerateReportRoutes = router;
module.exports = GenerateReportRoutes;
