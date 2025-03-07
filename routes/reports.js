const express = require("express");
const { findreports } = require("../controllers/ReportsControllers");
const router = express.Router();

router.post("/", findreports);

module.exports = router;
