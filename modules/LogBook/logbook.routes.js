const express = require("express");
const { createLogBook, getLogBooks, deleteLogBook } = require("./logbook.controller");
// const { create } = require("./logbook.model");

const router = express.Router();

router.post("/addlogbook", createLogBook);
router.get("/all-logbooks", getLogBooks);
router.delete("/delete-logbook/:id", deleteLogBook);

const LogBookRoutes = router;
module.exports = LogBookRoutes;
