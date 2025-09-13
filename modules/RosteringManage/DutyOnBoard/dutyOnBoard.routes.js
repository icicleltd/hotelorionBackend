const express = require("express");
const DutyOnBoardController = require("./dutyOnBoard.controller");

const router = express.Router();

router.post("/create-duty-on-Board", DutyOnBoardController.createADutyOnBoard);
router.get("/get-all-duty-roster", DutyOnBoardController.getAllDutyRosters);
router.get("/get-duty-roster", DutyOnBoardController.getDutyRosterByDate);

// update duty roter by date
router.put("/update-duty-roster/:date", DutyOnBoardController.updateDutyRosterByDate);

const DutyOnBoardRoutes = router;
module.exports = DutyOnBoardRoutes;
