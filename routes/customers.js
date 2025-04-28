const express = require("express");
const { getCustomers, deleteCustomer, getTodayCheckouts, getTodayCheckoutCount, getDueCheckoutsCustomers, addDueAmountFromCustomer } = require("../controllers/customerControllers");
const router = express.Router();

router.get("/allcustomers", getCustomers);
router.get("/today-checkout", getTodayCheckouts);
router.delete("/deletecustomer/:id", deleteCustomer);
router.get("/due-checkout-customer", getDueCheckoutsCustomers)
router.patch("/add-due-amount/:id", addDueAmountFromCustomer);

// for room booking count per day
router.get("/room-booking-count", getTodayCheckoutCount);

module.exports = router;
