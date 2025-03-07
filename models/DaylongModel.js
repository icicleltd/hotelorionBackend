const mongoose = require("mongoose");
const { Schema } = mongoose;

const daylongschema = new Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    organizationName: {
      type: String,
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
    adult: {
      type: Number,
    },
    adultPrice: {
      type: Number,
    },
    children: {
      type: Number,
    },
    childrenPrice: {
      type: Number,
    },
    driver: {
      type: Number,
    },
    driverPrice: {
      type: Number,
    },

    bookingDate: {
      type: String,
      required: true,
    },
    previousDate: {
      type: String,
    },
    paidAmount: {
      type: Number,
      required: true,
    },
    dueAmount: {
      type: Number,
    },
    percentagediscount: {
      type: Number,
    },
    flatDiscount: {
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
    addonsName: {
      type: Array,
      default: [],
    },
    addonsPrices: {
      type: Array,
      default: [],
    },
    roomType: {
      type: Array,
    },
    roomsNumber: {
      type: Array,
      default: [],
    },
    discountFlatroom: {
      type: String,
    },
    discountPercentageroom: {
      type: String,
    },
    beforeRoomCost: {
      type: String,
    },
    roomsCost: {
      type: Number,
    },

    checkIn: {
      type: String,
      default: "checked In",
    },
    isCorporate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Daylong = mongoose.model("Daylong", daylongschema);
module.exports = Daylong;
