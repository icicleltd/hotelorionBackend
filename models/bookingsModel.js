const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookingschema = new Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    bookingroom: {
      type: Array,
    },
    customerNumber: {
      type: Number,
      required: true,
    },
    authentication: {
      type: String,
    },
    authenticationNumber: {
      type: String,
    },
    firstDate: {
      type: String,
    },
    lastDate: {
      type: String,
    },
    roomNumber: {
      type: Array,
    },
    person: {
      type: Number,
    },
    bookingDate: {
      type: String,
    },
    paidAmount: {
      type: Number,
    },
    dueAmount: {
      type: Number,
    },
    discountPercentage: {
      type: Number,
    },
    discountFlat: {
      type: Number,
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

    bookedFrom: {
      type: String,
    },
    isRegistered: {
      type: Boolean,
      default: false,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    referredBy: {
      type: String,
    },

    remarks: {
      type: String,
    },

    beforeDiscountCost: {
      type: Number,
    },
    nidFile: {
      type: String,
    },

    checkIn: {
      type: String,
      default: "checked In",
    },
    isCorporate: {
      type: Boolean,
      default: false,
    },

    addons: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

const Bookings = mongoose.model("Bookings", bookingschema);
module.exports = Bookings;
