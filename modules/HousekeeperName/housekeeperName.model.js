const { Schema, model } = require("mongoose");

const housekeeperNameSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    idNumber: {
      type: String,
    },
  },
  { timestamps: true }
);

const HousekeeperNameModel = model("HousekeeperName", housekeeperNameSchema);
module.exports = HousekeeperNameModel;
