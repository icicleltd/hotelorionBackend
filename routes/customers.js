const express = require("express");
const { getCustomers, deleteCustomer } = require("../controllers/customerControllers");
const router = express.Router();

router.get("/allcustomers", getCustomers);
router.delete("/deletecustomer/:id", deleteCustomer);

module.exports = router;
