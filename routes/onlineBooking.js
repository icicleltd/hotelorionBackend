const express = require("express");
const {
  getonlonebookings,
  createonlinebookings,
  changeseenbookings,
  deleteOnlineBooking,
  deleteOnlineBookingWithoutRoom,
} = require("../controllers/onlineBookingControllers");
const router = express.Router();

router.post("/add-onlinebookings", createonlinebookings);
router.get("/allonlinebookings", getonlonebookings);
router.put("/changeseenbookings/:id", changeseenbookings);
router.delete("/allonlinebookings/:roomNumber", deleteOnlineBooking)
router.delete("/allonlinebookings-without-room/:id", deleteOnlineBookingWithoutRoom)

module.exports = router;
