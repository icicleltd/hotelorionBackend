const express = require("express");
const {
  createHousekeeping,
  getAllHousekeeping,
  updateHousekeeping,
} = require("../controllers/housekeepingControllers");
const router = express.Router();

router.post("/add-housekeeping", createHousekeeping);
router.get("/", getAllHousekeeping);
router.patch("/:roomName", updateHousekeeping)

const housekeepingRouter = router;
module.exports = housekeepingRouter;
