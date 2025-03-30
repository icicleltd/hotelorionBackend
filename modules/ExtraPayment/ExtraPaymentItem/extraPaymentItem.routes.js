const express = require("express");
const { 
  createExtraPaymentItem,
  getAllExtraPaymentItems,
  getExtraPaymentItemById,
  updateExtraPaymentItem,
  deleteExtraPaymentItem
} = require("./extraPaymentItem.controller");

const router = express.Router();

// Create a new extra payment item
router.post("/add-item", createExtraPaymentItem);

// Get all extra payment items
router.get("/", getAllExtraPaymentItems);

// Get a specific extra payment item by ID
router.get("/extrapayment-item/:id", getExtraPaymentItemById);

// Update an extra payment item
router.put("/extrapayment-item/:id", updateExtraPaymentItem);

// Delete an extra payment item
router.delete("/extrapayment-item/:id", deleteExtraPaymentItem);

const ExtraPaymentItemRoutes = router;
module.exports = ExtraPaymentItemRoutes;