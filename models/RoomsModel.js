const mongoose = require("mongoose");
const { Schema } = mongoose;

const roomschema = new Schema(
  {
    roomname: {
      type: String,
      required: true,
    },
    bedtype: {
      type: String,
      required: true,
    },
    cost: {
      type: Number,
      required: true,
    },
    facilities: {
      type: Array,
      required: true,
    },
    roomnumber: {
      type: Array,
      required: true,
    },
    maxcapacity: {
      type: Number,
      required: true,
    },
    checkin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Rooms = mongoose.model("Rooms", roomschema);
module.exports = Rooms;
