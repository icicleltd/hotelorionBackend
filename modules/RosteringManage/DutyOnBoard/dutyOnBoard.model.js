const mongoose = require("mongoose");
const { Schema } = mongoose;

// Sub-schema for a single shift assignment
const dutyAssignmentSchema = new Schema({
  date: {
    type: String,
    required: false,
  },
  timeRange: {
    type: String,
    required: true,
  },
  shift: {
    type: String,
    enum: ["day_shift", "night_shift"],
    required: true,
  },

  housekeeper: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  frontdesk: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const dutyOnBoardSchema = new Schema(
  {
    dateRange: {
      type: String,
      //   required: true,
    },
    dutyOnHousekeeper: [dutyAssignmentSchema],
    dutyOnFrontdesk: [dutyAssignmentSchema],
  },
  { timestamps: true }
);

const DutyOnBoardModel = mongoose.model("DutyOnBoard", dutyOnBoardSchema);
module.exports = DutyOnBoardModel;
