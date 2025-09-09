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
  housekeeper: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    required: false,
  },
  frontdesk: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    required: false,
  },
}, {
  minimize: false,
  toJSON: { 
    transform: function(doc, ret) {
      // Remove empty arrays and undefined fields from JSON output
      if (ret.housekeeper !== undefined && ret.housekeeper.length === 0) {
        delete ret.housekeeper;
      }
      if (ret.frontdesk !== undefined && ret.frontdesk.length === 0) {
        delete ret.frontdesk;
      }
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      // Remove empty arrays and undefined fields from Object output
      if (ret.housekeeper !== undefined && ret.housekeeper.length === 0) {
        delete ret.housekeeper;
      }
      if (ret.frontdesk !== undefined && ret.frontdesk.length === 0) {
        delete ret.frontdesk;
      }
      return ret;
    }
  }
});

// Pre-save middleware to remove empty arrays before saving
dutyAssignmentSchema.pre('save', function() {
  if (this.housekeeper !== undefined && this.housekeeper.length === 0) {
    this.housekeeper = undefined;
  }
  if (this.frontdesk !== undefined && this.frontdesk.length === 0) {
    this.frontdesk = undefined;
  }
});

const dutyOnBoardSchema = new Schema(
  {
    dateRange: {
      type: String,
      required: false,
    },
    dutyOnHousekeeper: [dutyAssignmentSchema],
    dutyOnFrontdesk: [dutyAssignmentSchema],
  },
  { 
    timestamps: true,
    toJSON: { 
      transform: function(doc, ret) {
        return ret;
      }
    }
  }
);

const DutyOnBoardModel = mongoose.model("DutyOnBoard", dutyOnBoardSchema);
module.exports = DutyOnBoardModel;