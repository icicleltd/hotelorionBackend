const OnlineBooking = require("../models/OnlineBookingModel");

exports.createonlinebookings = async (req, res, next) => {
  try {
    const onlinebookings = await OnlineBooking.create(req.body);
    res.status(200).json({
      message: "Online Bookings added successfully",
      data: onlinebookings,
    });
  } catch (error) {
    next(error);
  }
};

exports.getonlonebookings = async (req, res, next) => {
  try {
    const onlinebookings = await OnlineBooking.find()
      .sort({ createdAt: -1 })
      .select("-__v -updatedAt -createdAt -_id");
    res.status(200).json({
      message: "Online Bookings get successfully",
      data: onlinebookings,
    });
  } catch (error) {
    next(error);
  }
};

exports.changeseenbookings = async (req, res, next) => {
  try {
    const id = req.params.id;
    const updatecheckin = await OnlineBooking.findByIdAndUpdate(
      id,
      { unseen: false },
      { new: true }
    );
    res.status(200).json({
      message: "Online Bookings updated successfully",
      data: updatecheckin,
    });
  } catch (error) {
    next(error);
  }
};
