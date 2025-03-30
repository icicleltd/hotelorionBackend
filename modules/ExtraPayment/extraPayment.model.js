const e = require("express");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const extraPaymentSchema = new Schema(
  {
    booking_id: {
      type: Schema.Types.ObjectId,
      ref: "Bookings"
    },
    extraServiceName: {
      type: String,
      required: true,
    },
    extraServiceRoomNumber: {
      type: String,
      required: true,
    },
    extraServicePrice: {
      type: Number,
      required: true,
    },
    extraServiceTotal: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const ExtraPaymentModel = mongoose.model("ExtraPayment", extraPaymentSchema);
module.exports = ExtraPaymentModel;
