const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookingschema = new Schema(
  {
    bookingId: {
      type: String,
      // unique: true,
    },
    customerTitle: {
      type: String,
      enum: ["Mr.", "Mrs.", "Ms."],
      default: "Mr.",
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
    discountPercentageAmount: {
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
    profession: {
      type: String,
      enum: ["Service", "Business", "Student", "Others"],
      default: "Business",
    },
    bookedFrom: {
      type: String,
    },
    isRegistered: {
      type: Boolean,
      default: false,
    },

    isTodayCheckout: {
      type: Boolean,
      default: false,
    },
    isSingle: {
      type: String,
      default: false,
    },
    referredBy: {
      type: String,
    },
    remarks: {
      type: String,
      // enum: ["normal checkout", "early checkout", "late checkout"],
      // default: "normal checkout",
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
    roomRent: {
      type: Number,
    },
    isCorporate: {
      type: Boolean,
      default: false,
    },
    corporateName: {
      type: String,
    },
    corporatePhone: {
      type: String,
    },
    addressOrCompanyName: {
      type: String,
    },
    addons: {
      type: Array,
      default: [],
    },
    extraPayment: {
      type: Schema.Types.ObjectId,
      ref: "ExtraPayment",
    },
  },
  { timestamps: true }
);

const Bookings = mongoose.model("Bookings", bookingschema);
module.exports = Bookings;
