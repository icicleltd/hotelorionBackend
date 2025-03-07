const Contacts = require("../models/ContactsModel");

exports.createContacts = async (req, res, next) => {
  try {
    const contacts = await Contacts.create(req.body);
    res.status(200).json({
      message: "Contact Create successfully",
      data: contacts,
    });
  } catch (error) {
    next(error);
  }
};
exports.getContacts = async (req, res, next) => {
  try {
    const getcontacts = await Contacts.find();
    res.status(200).json({
      message: "Contact get successfully",
      data: getcontacts,
    });
  } catch (error) {
    next(error);
  }
};
