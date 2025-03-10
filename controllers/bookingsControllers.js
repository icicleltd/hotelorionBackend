const CorporateBooking = require("../models/CorporateBookingModel");
const Customers = require("../models/CustomersModel");
const Daylong = require("../models/DaylongModel");
const Bookings = require("../models/bookingsModel");

exports.createbookings = async (req, res, next) => {
  try {
    // Get booking data from request body
    const bookingData = req.body;

    // Process nested JSON objects that were stringified
    if (bookingData.payment && typeof bookingData.payment === "string") {
      bookingData.payment = JSON.parse(bookingData.payment);
    }

    if (
      bookingData.roomDetails &&
      typeof bookingData.roomDetails === "string"
    ) {
      bookingData.roomDetails = JSON.parse(bookingData.roomDetails);
    }

    // Handle arrays that might be stringified
    if (
      bookingData.bookingroom &&
      typeof bookingData.bookingroom === "string"
    ) {
      try {
        bookingData.bookingroom = JSON.parse(bookingData.bookingroom);
      } catch (e) {
        // If it's a comma-separated string, convert to array
        bookingData.bookingroom = bookingData.bookingroom.split(",");
      }
    }

    if (bookingData.roomNumber && typeof bookingData.roomNumber === "string") {
      try {
        bookingData.roomNumber = JSON.parse(bookingData.roomNumber);
      } catch (e) {
        // If it's a comma-separated string, convert to array
        bookingData.roomNumber = bookingData.roomNumber.split(",");
      }
    }

    // Generate booking serial number
    // Find the last booking to get the highest serial number
    const lastBooking = await Bookings.findOne().sort({ createdAt: -1 });

    // Initialize the serial number
    let serialNumber;

    if (!lastBooking || !lastBooking.bookingId) {
      // If no booking exists or no bookingId field exists, start with 1
      serialNumber = "R-0001";
    } else {
      // Extract the number part, increment it, and create a new serial number
      const lastSerialNumber = lastBooking.bookingId;
      const numPart = parseInt(lastSerialNumber.split("-")[1]);
      const newNumPart = numPart + 1;
      serialNumber = `R-${newNumPart.toString().padStart(4, "0")}`;
    }

    // Add the serial number to the booking data
    bookingData.bookingId = serialNumber;

    // If a file was uploaded, add the Cloudinary information to the booking data
    if (req.file) {
      bookingData.nidFile = req.file.path;
      // Cloudinary URL
    }

    // Create the booking in your database
    const bookings = await Bookings.create(bookingData);

    res.status(200).json({
      message: "Booking created successfully",
      data: bookings,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    next(error);
  }
};

exports.getbookings = async (req, res, next) => {
  try {
    const bookings = await Bookings.find().sort({ createdAt: -1 });
    const daylong = await Daylong.find();
    const corporate = await CorporateBooking.find();

    const allbookings = [...bookings, ...daylong, ...corporate];

    res.status(200).json({
      message: "Bookings get successfully",
      data: allbookings,
    });
  } catch (error) {
    next(error);
  }
};

exports.getbookingsbyroomNumber = async (req, res, next) => {
  try {
    const { roomnumber, date } = req.query;
    const bookings = await Bookings.find({
      $or: [
        { firstDate: { $lte: date }, lastDate: { $gt: date } },
        { firstDate: { $lte: date }, lastDate: null },
        { firstDate: null, lastDate: { $gt: date } },
      ],
    });
    const daylong = await Daylong.find({
      bookingDate: date,
    });

    const allbookings = [...bookings, ...daylong];

    const filteredBookings = allbookings.filter((booking) => {
      if (Array.isArray(booking?.roomNumber)) {
        return booking?.roomNumber?.includes(roomnumber);
      }
      if (Array.isArray(booking?.roomsNumber)) {
        return booking?.roomsNumber?.includes(roomnumber);
      }
    });

    res.status(200).json({
      message: "Bookings by roomnumber get successfully",
      data: filteredBookings,
    });
  } catch (error) {
    next(error);
  }
};

exports.getbookingsbydate = async (req, res, next) => {
  try {
    const { date } = req.query;
    const bookings = await Bookings.find({ lastDate: date });
    res.status(200).json({
      message: "Bookings get by Date successfully",
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

exports.getbookingsbyroomname = async (req, res, next) => {
  try {
    const { roomname } = req.query;
    const bookings = await Bookings.find({ bookingroom: roomname });
    res.status(200).json({
      message: "Bookings get by Date successfully",
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// get one booking using by id
exports.getSingleBookings = async (req, res, next) => {
  try {
    const id = req.params.id;
    const query = { _id: id };
    const bookings = await Bookings.findOne(query);
    res.status(200).json({
      message: "Bookings single Data successfully",
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

exports.updatebooking = async (req, res, next) => {
  try {
    const id = req.params.id;

    const updatecheckin = await Bookings.findById(id);

    if (updatecheckin) {
      const updatedBooking = await Bookings.findByIdAndUpdate(
        id,
        {
          checkIn: "Checked Out",
        },
        { new: true }
      );

      if (!updatedBooking) {
        return res.status(404).json({ message: "Check In Status Not Changed" });
      }

      const customer = new Customers({
        ...updatedBooking.toObject(),
        _id: undefined,
      });

      await customer.save();
      await Bookings.findByIdAndDelete(id);

      return res.status(200).json({
        message: "Booking checked out Successfully and moved to customers",
      });
    }

    const updatedaylongcheckin = await Daylong.findById(id);
    if (updatedaylongcheckin) {
      await Daylong.findByIdAndUpdate(
        id,
        {
          checkIn: "Checked Out",
        },
        { new: true }
      );

      const customer = new Customers({
        ...updatedaylongcheckin.toObject(),
        _id: undefined,
      });

      await customer.save();
      await Daylong.findByIdAndDelete(id);

      return res.status(200).json({
        message:
          "Daylong booking checked out Successfully and moved to customers",
      });
    }

    const updateCorporateBooking = await CorporateBooking.findById(id);
    if (updateCorporateBooking) {
      await CorporateBooking.findByIdAndUpdate(
        id,
        {
          checkIn: "Checked Out",
        },
        { new: true }
      );

      const customer = new Customers({
        ...updateCorporateBooking.toObject(),
        _id: undefined,
      });

      await customer.save();
      await CorporateBooking.findByIdAndDelete(id);

      return res.status(200).json({
        message:
          "Daylong booking checked out Successfully and moved to customers",
      });
    }

    // If neither regular booking nor daylong booking found, return error
    return res.status(404).json({ message: "Booking not found" });
  } catch (error) {
    next(error);
  }
};

// exports.updatebooking = async (req, res, next) => {
//   try {
//     const id = req.params.id;
//     const updatecheckin = await Bookings.findByIdAndUpdate(
//       id,
//       {
//         checkIn: "Checked Out",
//       },
//       { new: true }
//     );
//     const updatedaylongcheckin = await Daylong.findByIdAndUpdate(
//       id,
//       {
//         checkIn: "Checked Out",
//       },
//       { new: true }
//     );

//     if (!updatecheckin) {
//       return res.status(404).json({ message: "Check In Status Not Changed" });
//     }

//     const customers = new Customers({
//       _id: updatecheckin?._id,
//       bookingroom: updatecheckin?.bookingroom,
//       customerName: updatecheckin?.customerName,
//       customerNumber: updatecheckin?.customerNumber,
//       authentication: updatecheckin?.authentication,
//       authenticationNumber: updatecheckin?.authenticationNumber,
//       firstDate: updatecheckin?.firstDate,
//       lastDate: updatecheckin?.lastDate,
//       roomNumber: updatecheckin?.roomNumber,
//       person: updatecheckin?.person,
//       bookingDate: updatecheckin?.bookingDate,
//       paidAmount: updatecheckin?.paidAmount,
//       dueAmount: updatecheckin?.dueAmount,
//       checkIn: updatecheckin?.checkIn,
//       discountPercentage: updatecheckin?.discountPercentage,
//       discountFlat: updatecheckin?.discountFlat,
//       paymentMethod: updatecheckin?.paymentMethod,
//       checkNumber: updatecheckin?.checkNumber,
//       transactionId: updatecheckin?.transactionId,
//       bookedFrom: updatecheckin?.bookedFrom,
//       referredBy: updatecheckin?.referredBy,
//       remarks: updatecheckin?.remarks,
//       isDayLong: updatecheckin?.isDayLong,
//     });

//     await customers.save();
//     await Bookings.findByIdAndDelete(id);

//     res.status(200).json({
//       message: "Booking checked out Successfully and moved to customers",
//     });
//   } catch (error) {
//     next(error);

//   }
// };

exports.updateduepayment = async (req, res, next) => {
  try {
    const { amount, id, payment, corporateChecked } = req.body;

    if (corporateChecked) {
      //update Corporate status changed Booking payment
      await Bookings.findByIdAndUpdate(
        id,
        {
          $set: { isCorporate: true },
        },
        { new: true }
      );

      //update daylong Booking payment
      await Daylong.findByIdAndUpdate(
        id,
        {
          $set: { isCorporate: true },
        },
        { new: true }
      );

      //update Corporate Booking payment
      await CorporateBooking.findByIdAndUpdate(
        id,
        {
          $set: { isCorporate: true },
        },
        { new: true }
      );
    } else {
      //update night Stay Booking payment
      await Bookings.findByIdAndUpdate(
        id,
        {
          $inc: { paidAmount: amount, dueAmount: -amount },
          $push: { payment: payment },
        },
        { new: true }
      );

      //update daylong Booking payment
      await Daylong.findByIdAndUpdate(
        id,
        {
          $inc: { paidAmount: amount, dueAmount: -amount },
          $push: { payment: payment },
        },
        { new: true }
      );

      //update Corporate Booking payment
      await CorporateBooking.findByIdAndUpdate(
        id,
        {
          $inc: { paidAmount: amount, dueAmount: -amount },
          $push: { payment: payment },
        },
        { new: true }
      );
    }

    res.status(200).json({
      message: "Due Payment Updated Successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.deletebooking = async (req, res, next) => {
  try {
    const id = req.params.id;
    const deletedBooking = await Bookings.findByIdAndDelete(id);
    const deletedaylong = await Daylong.findByIdAndDelete(id);
    const deletecorporate = await CorporateBooking.findByIdAndDelete(id);

    if (!deletedBooking && !deletedaylong && !deletecorporate) {
      return res.status(404).json({ message: "Not Found" });
    } else {
      res.status(200).json({
        message: "Deleted successfully",
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.getroomsbyname = async (req, res) => {
  const roomname = req.query.roomname;
  try {
    const findrooms = await Bookings.find({ bookingroom: roomname });

    if (!findrooms) {
      return res.status(404).json({ message: "Not Found" });
    }

    const bookedDates = findrooms.map((booking) => ({
      start: booking.firstDate,
      end: booking.lastDate,
    }));
    res.status(200).json({
      message: "Find Room successfully",
      data: bookedDates,
    });
  } catch (error) {
    console.error("Error fetching booked dates:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updatenightstayaddons = async (req, res, next) => {
  try {
    const { addonsData, id } = req.body;
    const find = await Bookings.findById(id);

    const totalPrice = addonsData.reduce(
      (sum, item) => sum + Number(item.total),
      0
    );

    if (!find) {
      return res.status(404).json({ message: "Not Found" });
    } else {
      await Bookings.findByIdAndUpdate(id, {
        $push: { addons: addonsData },
        dueAmount: find.dueAmount + totalPrice,
      });
    }

    res.status(200).json({
      message: "Addons Update successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.updatedBookingInfo = async (req, res, next) => {
  try {
    const id = req.params.id;
    const updateData = req.body;

    // First, try to find and update regular booking
    let updatedBooking = await Bookings.findById(id);

    if (updatedBooking) {
      updatedBooking = await Bookings.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Booking information updated successfully",
        data: updatedBooking,
      });
    }

    // If no booking was found with the provided ID
    return res.status(404).json({
      success: false,
      message: "Booking not found",
    });
  } catch (error) {
    next(error);
  }
};
