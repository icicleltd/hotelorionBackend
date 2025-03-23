const e = require("express");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const logBookSchema = new Schema(
  {
    task: {
      type: String,
    },
    description: {
      type: String,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "high",
    },
  },
  { timestamps: true }
);

const logBookModel = mongoose.model("LogBook", logBookSchema);
module.exports = logBookModel;
