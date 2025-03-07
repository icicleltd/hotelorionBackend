const mongoose = require("mongoose");
const { Schema } = mongoose;

const reportschema = new Schema(
  {
    firstdate: {
      trype: String,
      required: true,
    },
    lastdate: {
      trype: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Reports = mongoose.model("Reports", reportschema);
module.exports = Reports;
