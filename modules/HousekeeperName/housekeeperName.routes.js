const express = require("express");
const { createHousekeeperName, getHousekeeperName } = require("./housekeeperName.controller");
const { get } = require("mongoose");
const router = express.Router();

router.post("/create", createHousekeeperName);
router.get("/", getHousekeeperName);

const HousekeeperNameRoutes = router;
module.exports = HousekeeperNameRoutes;
