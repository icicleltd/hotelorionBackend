const express = require("express");
const { 
  createExtraPayment,
  getAllExtraPayments,
  getExtraPaymentsByBookingId,
  getExtraPaymentById,
  updateExtraPayment,
  deleteExtraPayment,
  getExtraPaymentStats
} = require("./extraPayment.controller");

const router = express.Router();

// Create a new extra payment
router.post("/add-extrapayment/", createExtraPayment);

// Get all extra payments
router.get("/extrapayments", getAllExtraPayments);

// Get extra payments by booking ID
router.get("/extrapayments/booking/:bookingId", getExtraPaymentsByBookingId);

// Get a single extra payment by ID
router.get("/extrapayments/:id", getExtraPaymentById);

// Update an extra payment
router.put("/extrapayments/:id", updateExtraPayment);

// Delete an extra payment
router.delete("/extrapayments/:id", deleteExtraPayment);

// Get summary statistics for extra payments
router.get("/extrapayments-stats", getExtraPaymentStats);

const ExtraPaymentRoutes = router;
module.exports = ExtraPaymentRoutes;