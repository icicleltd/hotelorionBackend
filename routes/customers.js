const express = require("express");
const { getCustomers, deleteCustomer, getTodayCheckouts, getTodayCheckoutCount } = require("../controllers/customerControllers");
const router = express.Router();

router.get("/allcustomers", getCustomers);
router.get("/today-checkout", getTodayCheckouts);
router.delete("/deletecustomer/:id", deleteCustomer);

// for room booking count per day
router.get("/room-booking-count", getTodayCheckoutCount);

module.exports = router;
