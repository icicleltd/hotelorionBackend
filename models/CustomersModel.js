const mongoose = require("mongoose");
const { Schema } = mongoose;

const customerschema = new Schema(
  {
    bookingId: {
      type: String,
      // required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    bookingroom: {
      type: Array,
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
    firstDate: {
      type: String,
    },
    lastDate: {
      type: String,
    },
    checkInTime: {
      type: String,
    },
    checkOutTime: {
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
    discountPercentage: {
      type: Number,
    },
    discountPercentageAmount: {
      type: Number,
    },
    discountFlat: {
      type: Number,
    },
    paymentMethod: {
      type: String,
    },
    checkNumber: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    bookedFrom: {
      type: String,
      required: true,
    },
    referredBy: {
      type: String,
    },
    isDayLong: {
      type: Boolean,
    },
    remarks: {
      type: String,
    },
    checkoutStatus: {
      type: String,
      enum: [
        "Early CheckIn",
        "Early CheckOut",
        "Late CheckOut",
        "Normal CheckOut",
      ],
      default: "Normal CheckOut",
    },

    checkIn: {
      type: String,
      default: "checked In",
    },

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
    paidAmount: {
      type: Number,
      required: true,
    },
    dueAmount: {
      type: Number,
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
          bankName: {
            type: String,
          },
          paymentDate: {
            type: String,
          },
          amount: {
            type: Number,
          },
        },
      ],
      required: true,
    },
    percentagediscount: {
      type: Number,
    },
    isSingle: {
      type: String,
      default: false,
    },
    flatDiscount: {
      type: Number,
    },
    paymentmethod: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    checkNumber: {
      type: String,
    },
    bookedFrom: {
      type: String,
      required: true,
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
    roomsCost: {
      type: Number,
    },
    roomRent: {
      type: Number,
    },
    addressOrCompanyName: {
      type: String,
    },

    checkIn: {
      type: String,
      default: "checked In",
    },
    beforeDiscountCost: {
      type: Number,
    },
    isCorporate: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

const Customers = mongoose.model("Customers", customerschema);
module.exports = Customers;
