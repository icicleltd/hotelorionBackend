const express = require("express");
const {
  createCorporateBookings,
  getCorporateBookings,
  getCorporateBookingsbyDate,
} = require("../controllers/corporateBookingControllers");
const router = express.Router();

router.post("/add-conferencehall", createCorporateBookings);
router.get("/get-conferencehall", getCorporateBookings);
router.get("/get-conferencehallbyname", getCorporateBookingsbyDate);

module.exports = router;
