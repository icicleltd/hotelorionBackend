const express = require("express");
const {
  getComplaintByRoom,
  deleteComplaintByRoom,
  createComplaint,
} = require("../controllers/complaintRoomControllers");
const router = express.Router();

router.post("/:roomName", createComplaint);
router.get("/:roomName", getComplaintByRoom);
// router.patch("/:roomName", updateHousekeeping)
router.delete("/:roomName", deleteComplaintByRoom);

const complaintsRouter = router;
module.exports = complaintsRouter;
