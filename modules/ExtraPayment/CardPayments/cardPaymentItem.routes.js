const express = require("express");
const {
  createCardPaymentItem,
  getAllCardPaymentItems,
} = require("./cardPaymentItem.controller");

const router = express.Router();

// Create a new card payment item
router.post("/add-item", createCardPaymentItem);

// Get all card payment items
router.get("/", getAllCardPaymentItems);

// Get a single card payment item by ID
// router.get("/:id", getCardPaymentItemById);

// Update a card payment item
// router.put("/:id", updateCardPaymentItem);

// Delete a card payment item
// router.delete("/:id", deleteCardPaymentItem);

const CardPaymentItemRoutes = router;
module.exports = CardPaymentItemRoutes;
