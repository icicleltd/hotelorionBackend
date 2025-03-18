const mongoose = require("mongoose");
const { Schema } = mongoose;

const housekeepingSchema = new Schema(
  {
    housekeeperName: {
      type: String, // Fixed "trype" to "type"
      // required: true,
    },
    roomName: {
      type: [String], // Fixed "trype" to "type"
      // required: [true, "roomName is required"],
    },
    workingItem: {
      type: [String], // Fixed "trype" to "type"
    },
    isCleaning: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const HouseKeepingModel = mongoose.model("Housekeeping", housekeepingSchema);
module.exports = HouseKeepingModel;