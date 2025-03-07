const CorporateBooking = require("../models/CorporateBookingModel");

// Create Corporate Booking
exports.createCorporateBookings = async (req, res, next) => {
  try {
    const createBooking = await CorporateBooking.create(req.body);

    res.status(200).json({
      message: "Corporate Booking successfully",
      data: createBooking,
    });
  } catch (error) {
    next(error);
  }
};

// Get Corporate Booking
exports.getCorporateBookings = async (req, res, next) => {
  try {
    const getBooking = await CorporateBooking.find().select("-__v -updatedAt -createdAt");

    res.status(200).json({
      message: "Corporate Booking get successfully",
      data: getBooking,
    });
  } catch (error) {
    next(error);
  }
};

// Get Corporate Booking by date
exports.getCorporateBookingsbyDate = async (req, res, next) => {
  try {
    const { date } = req.query;
    const getBooking = await CorporateBooking.find({ bookingDate: date }).select(
      "-__v -updatedAt -createdAt"
    );

    res.status(200).json({
      message: "Corporate Booking get successfully",
      data: getBooking,
    });
  } catch (error) {
    next(error);
  }
};
