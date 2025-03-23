const express = require("express");
const { getCustomers, deleteCustomer, getTodayCheckouts } = require("../controllers/customerControllers");
const router = express.Router();

router.get("/allcustomers", getCustomers);
router.get("/today-checkout", getTodayCheckouts);
router.delete("/deletecustomer/:id", deleteCustomer);

module.exports = router;
