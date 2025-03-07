const mongoose = require("mongoose");
const { Schema } = mongoose;

const corporateSchema = new Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    organizationName: {
      type: String,
      required: true,
    },

    customerNumber: {
      type: String,
      required: true,
    },
    authentication: {
      type: String,
    },
    authenticationNumber: {
      type: String,
    },
    adult: {
      type: Number,
      required: true,
    },
    bookingDate: {
      type: String,
      required: true,
    },
    halls: {
      type: String,
      required: true,
    },
    addonsData: {
      type: Array,
      required: true,
    },
    payment: {
      type: [
        {
          paymentmethod: {
            type: String,
            required: true,
          },
          payNumber: {
            type: String,
          },
        },
      ],
      required: true,
    },
    hallPrice: {
      type: Number,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      required: true,
    },
    dueAmount: {
      type: Number,
      required: true,
    },

    bookedFrom: {
      type: String,
      required: true,
    },
    checkIn: {
      type: String,
      required: true,
    },
    isCorporate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const CorporateBooking = mongoose.model("CorporateBooking", corporateSchema);
module.exports = CorporateBooking;
