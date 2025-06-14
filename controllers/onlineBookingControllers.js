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
    const onlinebookings = await OnlineBooking.find().sort({ createdAt: -1 });

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

exports.deleteOnlineBooking = async (req, res, next) => {
  try {
    const roomNumber = req.params.roomNumber;
    // console.log(roomNumber)
    const deletedBooking = await OnlineBooking.findOneAndDelete({ roomNumber });
    // console.log(deletedBooking)

    if (!deletedBooking) {
      return res.status(404).json({
        message: "Online booking not found",
      });
    }

    res.status(200).json({
      message: "Online booking deleted successfully",
      data: deletedBooking,
    });
  } catch (error) {
    next(error);
  }
};
exports.deleteOnlineBookingWithoutRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    // console.log(id);

    const deletedBooking = await OnlineBooking.findOneAndDelete({ _id: id });
    // console.log(deletedBooking)

    if (!deletedBooking) {
      return res.status(404).json({
        message: "Online booking not found",
      });
    }

    res.status(200).json({
      message: "Online booking deleted successfully",
      data: deletedBooking,
    });
  } catch (error) {
    next(error);
  }
};
