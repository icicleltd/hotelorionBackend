const mongoose = require("mongoose");
const { Schema } = mongoose;

const contactschema = new Schema(
  {
    customerName: {
      type: String,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerJobTitle: {
      type: String,
    },
    customerNumber: {
      type: String,
      required: true,
    },
    customerSubject: {
      type: String,
      required: true,
    },
    customerMessage: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Contacts = mongoose.model("Contacts", contactschema);
module.exports = Contacts;
