const mongoose = require("mongoose");
const { Schema } = mongoose;

const onlinebookingschema = new Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      // required: true,
    },
    companyNameAddress: {
      type: String,
    },
    hostNameAndNumber: {
      type: String,
    },
    customerNumber: {
      type: Number,
      // required: true,
    },
    roomType: {
      type: String,
      required: true,
    },
    roomNumber: {
      type: String,
    },
    roomsNeed: {
      type: Number,
      // required: true,
    },
    adults: {
      type: Number,
    },
    paymentMethod: {
      type: Number,
    },
    advancePayment: {
      type: Number,
    },

    childrens: {
      type: Number,
      // required: true,
    },
    person: {
      type: Number,
      // required: true,
    },

    chekinDate: {
      type: String,
      required: true,
    },
    chekoutDate: {
      type: String,
    },
    additionalInformation: {
      type: String,
    },
    isBookings: {
      type: Boolean,
      default: true,
    },
    unseen: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const OnlineBooking = mongoose.model("OnlineBooking", onlinebookingschema);
module.exports = OnlineBooking;
