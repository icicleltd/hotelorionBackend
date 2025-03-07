const BookingGuestModel = require("./bookingGuset.model");

const createBookingGuest = async (req, res) => {
  try {
    const data = req.body;
    const result = await BookingGuestModel.create(data);
    res.status(201).json({
      status: "success",
      message: "Booking created successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

module.exports = { createBookingGuest };
