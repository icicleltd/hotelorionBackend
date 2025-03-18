const mongoose = require("mongoose");
const { Schema } = mongoose;

const complaintRoomsSchema = new Schema(
  {
    complaintRooms: {
      type: [String],
      // required: true,
    },
    complaints: {
      type: [String],
      // required: true,
    },
    isComplaints: {
      type: Boolean,
      default: false,
      // required: true,
    },
  },
  { timestamps: true }
);

const ComplaintRoomModel = mongoose.model(
  "ComplaintsRoom",
  complaintRoomsSchema
);
module.exports = ComplaintRoomModel;