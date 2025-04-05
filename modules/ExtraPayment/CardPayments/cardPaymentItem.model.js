const mongoose = require("mongoose");
const { Schema } = mongoose;

const cardPaymentItemSchema = new Schema(
  {
    cardPaymentItemName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const CardPaymentItemModel = mongoose.model(
  "CardPaymentItem",
  cardPaymentItemSchema
);
module.exports = CardPaymentItemModel;
