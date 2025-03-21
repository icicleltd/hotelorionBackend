const express = require("express");
const {
  getonlonebookings,
  createonlinebookings,
  changeseenbookings,
  deleteOnlineBooking,
} = require("../controllers/onlineBookingControllers");
const router = express.Router();

router.post("/add-onlinebookings", createonlinebookings);
router.get("/allonlinebookings", getonlonebookings);
router.put("/changeseenbookings/:id", changeseenbookings);
router.delete("/allonlinebookings/:roomNumber", deleteOnlineBooking)

module.exports = router;
