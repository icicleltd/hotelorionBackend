const mongoose = require("mongoose");
const { Schema } = mongoose;

const extraPaymentItemSchema = new Schema(
  {
    extraPaymentItemName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ExtraPaymentItemModel = mongoose.model(
  "ExtraPaymentItem",
  extraPaymentItemSchema
);
module.exports = ExtraPaymentItemModel;
