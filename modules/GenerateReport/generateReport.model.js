const e = require("express");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const generateReportSchema = new Schema(
  {
    currentTime: {
      type: String,
      required: true,
    },
    currentDate: {
      type: String,
      required: true,
    },
    checkoutCustomers: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

const GenerateReportModel = mongoose.model(
  "GenerateReport",
  generateReportSchema
);
module.exports = GenerateReportModel;
