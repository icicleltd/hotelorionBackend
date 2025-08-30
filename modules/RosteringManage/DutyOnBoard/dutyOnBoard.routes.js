const express = require("express");
const DutyOnBoardController = require("./dutyOnBoard.controller");

const router = express.Router();

router.post("/create-duty-on-Board", DutyOnBoardController.createADutyOnBoard);

const DutyOnBoardRoutes = router;
module.exports = DutyOnBoardRoutes;
