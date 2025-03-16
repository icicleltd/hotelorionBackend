const CorporateBooking = require("../models/CorporateBookingModel");
const Customers = require("../models/CustomersModel");
const Daylong = require("../models/DaylongModel");
const OnlineBooking = require("../models/OnlineBookingModel");
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
    // Get today's date in 'YYYY-MM-DD' format
    const today = new Date();
    const todayFormatted = today.toISOString().split("T")[0]; // Format: 'YYYY-MM-DD'

    // First, reset all bookings that are no longer today's checkout
    await Bookings.updateMany(
      { isTodayCheckout: true, lastDate: { $ne: todayFormatted } },
      { $set: { isTodayCheckout: false } }
    );

    // Then, set today's checkouts
    await Bookings.updateMany(
      { lastDate: todayFormatted, isTodayCheckout: false },
      { $set: { isTodayCheckout: true } }
    );

    // Now fetch the updated bookings
    const bookings = await Bookings.find().sort({ createdAt: -1 });
    const daylong = await Daylong.find();
    const corporate = await CorporateBooking.find();

    // Combine all bookings
    const allbookings = [...bookings, ...daylong, ...corporate];

    res.status(200).json({
      message: "Bookings get successfully",
      data: allbookings,
    });
  } catch (error) {
    next(error);
  }
};

exports.roomsColorStatus = async (req, res, next) => {
  try {
    // Extract date parameter properly
    const dateParam = req.params.date;
    
    // Create a valid Date object based on the parameter or use current date
    let currentDate;
    if (dateParam) {
      // If date parameter is provided, create a date from it
      currentDate = new Date(dateParam);
      
      // Check if the date is valid
      if (isNaN(currentDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Please use YYYY-MM-DD format."
        });
      }
    } else {
      // Use current date if no parameter provided
      currentDate = new Date();
    }

    const timeZone = "Asia/Dhaka";
    const formattedDateString = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(currentDate);
    
    // Parse the formatted date string back to a Date object
    // Format is MM/DD/YYYY, HH:MM:SS AM/PM
    const parts = formattedDateString.split(", ");
    const dateParts = parts[0].split("/");
    const timeParts = parts[1].split(" ");
    const timeValues = timeParts[0].split(":");

    // Create date from parts (month is 0-indexed in JS Date)
    const dhakaNow = new Date(
      parseInt(dateParts[2]), // year
      parseInt(dateParts[0]) - 1, // month (0-indexed)
      parseInt(dateParts[1]), // day
      timeParts[1] === "PM" && parseInt(timeValues[0]) !== 12
        ? parseInt(timeValues[0]) + 12 // hour (convert to 24hr)
        : timeParts[1] === "AM" && parseInt(timeValues[0]) === 12
        ? 0 // midnight (12 AM)
        : parseInt(timeValues[0]), // other hours
      parseInt(timeValues[1]), // minutes
      parseInt(timeValues[2]) // seconds
    );

    // Format as YYYY-MM-DD for database queries
    const todayFormatted = dhakaNow.toISOString().split("T")[0];

    // First, update the isTodayCheckout flag for all bookings to ensure it's accurate
    await Bookings.updateMany(
      { isTodayCheckout: true, lastDate: { $ne: todayFormatted } },
      { $set: { isTodayCheckout: false } }
    );

    await Bookings.updateMany(
      { lastDate: todayFormatted, isTodayCheckout: false },
      { $set: { isTodayCheckout: true } }
    );

    // Fetch all bookings from Bookings collection
    const bookings = await Bookings.find({
      isRegistered: true,
    });

    // Fetch online bookings that are not yet converted to registrations
    const onlineBookings = await OnlineBooking.find({
      isBookings: true,
    });

    // Initialize room category arrays
    const registeredAndTodayCheckout = [];
    const registeredAndNotTodayCheckout = [];
    const previousRegisteredAndNotTodayCheckout = [];
    const bookingRooms = [];

    // Helper function to process room numbers
    const processRoomNumbers = (booking, roomNumbers) => {
      if (booking.isTodayCheckout === true) {
        // If registered and checking out today
        registeredAndTodayCheckout.push(...roomNumbers);
      } else if (booking.firstDate === todayFormatted) {
        // If check-in is today
        registeredAndNotTodayCheckout.push(...roomNumbers);
      } else if (
        booking.firstDate < todayFormatted &&
        booking.lastDate > todayFormatted
      ) {
        // If stay spans across today (checked in before, checking out after)
        previousRegisteredAndNotTodayCheckout.push(...roomNumbers);
      }
    };

    // Process registered bookings
    bookings.forEach((booking) => {
      if (Array.isArray(booking.roomNumber)) {
        processRoomNumbers(booking, booking.roomNumber);
      } else if (typeof booking.roomNumber === "string") {
        // Handle case where roomNumber might be a comma-separated string
        const roomNumbers = booking.roomNumber
          .split(",")
          .map((room) => room.trim());
        processRoomNumbers(booking, roomNumbers);
      }
    });

    // Process online bookings
    onlineBookings.forEach((booking) => {
      if (booking.roomNumber) {
        if (typeof booking.roomNumber === "string") {
          // Handle comma-separated room numbers
          const roomNumbers = booking.roomNumber
            .split(",")
            .map((room) => room.trim());
          bookingRooms.push(...roomNumbers);
        } else if (Array.isArray(booking.roomNumber)) {
          // Handle array of room numbers
          bookingRooms.push(...booking.roomNumber);
        } else {
          // Handle single room number
          bookingRooms.push(booking.roomNumber);
        }
      }
    });

    // Remove duplicates from each array
    const uniqueRegisteredAndTodayCheckout = [
      ...new Set(registeredAndTodayCheckout),
    ];
    const uniqueRegisteredAndNotTodayCheckout = [
      ...new Set(registeredAndNotTodayCheckout),
    ];
    const uniquePreviousRegisteredAndNotTodayCheckout = [
      ...new Set(previousRegisteredAndNotTodayCheckout),
    ];
    const uniqueBookingRooms = [...new Set(bookingRooms)];

    // Create the roomsColor object
    const roomsColor = {
      registeredAndTodayCheckout: uniqueRegisteredAndTodayCheckout,
      registeredAndNotTodayCheckout: uniqueRegisteredAndNotTodayCheckout,
      previousRegisteredAndNotTodayCheckout:
        uniquePreviousRegisteredAndNotTodayCheckout,
      bookingRooms: uniqueBookingRooms,
      currentDate: formattedDateString,
      formattedForQueries: todayFormatted,
    };

    // Return the response
    res.status(200).json({
      message: "Room status colors retrieved successfully",
      data: roomsColor,
    });
  } catch (error) {
    console.error("Error in roomsColorStatus:", error);
    next(error);
  }
};

exports.getLastbookingsId = async (req, res, next) => {
  try {
    // Find the last booking to get the highest serial number
    const lastBooking = await Bookings.findOne().sort({ createdAt: -1 });

    let serialNumber;

    if (!lastBooking || !lastBooking.bookingId) {
      // If no booking exists or no bookingId field exists, return default
      serialNumber = "0000";
    } else {
      // Return the last booking ID
      serialNumber = lastBooking.bookingId;
    }

    res.status(200).json({
      message: "Last booking ID retrieved successfully",
      bookingId: serialNumber,
    });
  } catch (error) {
    console.error("Error retrieving last booking ID:", error);
    next(error);
  }
};

exports.getbookingsbyroomNumber = async (req, res, next) => {
  try {
    const { roomnumber, date } = req.query;

    const updateDate = new Date(date);

    const bookings = await Bookings.find({
      $or: [
        { firstDate: { $lte: date }, lastDate: { $gte: date } },
        { firstDate: { $lte: date }, lastDate: null },
        { firstDate: null, lastDate: { $gte: date } },
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

      console.log(filteredBookings);
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
    const { bookingId, payment, ...otherUpdateData } = req.body;
    console.log(bookingId, payment)
    
    // First, find the existing booking to get current payment array
    const existingBooking = await Bookings.findOne({ bookingId });
    
    if (!existingBooking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    let updateData = { ...otherUpdateData };
    
    // If payment data is provided, add it to the existing payments array
    if (payment) {
      // Use $push to add the new payment to the existing payment array
      await Bookings.findOneAndUpdate(
        { bookingId },
        { $push: { payment: payment } },
        { new: false }
      );
    }
    
    // Update all other booking information if there's any
    if (Object.keys(updateData).length > 0) {
      await Bookings.findOneAndUpdate(
        { bookingId },
        updateData,
        { new: false }
      );
    }
    
    // Get the updated booking data to return
    const updatedBooking = await Bookings.findOne({ bookingId });
    
    // Calculate total paid amount from all payments
    const totalPaidAmount = updatedBooking.payment.reduce((total, pay) => {
      return total + (pay.amount || 0);
    }, 0);
    
    // Update paidAmount field to reflect the total of all payments
    await Bookings.findOneAndUpdate(
      { bookingId },
      { 
        paidAmount: totalPaidAmount,
        // Recalculate dueAmount based on beforeDiscountCost, discounts, and paid amount
        dueAmount: calculateDueAmount(
          updatedBooking.beforeDiscountCost,
          updatedBooking.discountPercentage,
          updatedBooking.discountFlat,
          totalPaidAmount
        )
      },
      { new: true }
    );
    
    // Get the final updated booking
    const finalUpdatedBooking = await Bookings.findOne({ bookingId });
    
    res.status(200).json({
      message: "Booking updated successfully",
      data: finalUpdatedBooking,
    });
    
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Helper function to calculate due amount
function calculateDueAmount(beforeDiscountCost, discountPercentage, discountFlat, paidAmount) {
  // Calculate discount amount from percentage
  const percentageDiscount = beforeDiscountCost * (discountPercentage || 0) / 100;
  
  // Apply both percentage and flat discounts
  const afterDiscountCost = beforeDiscountCost - percentageDiscount - (discountFlat || 0);
  
  // Calculate due amount (cannot be negative)
  return Math.max(0, afterDiscountCost - paidAmount);
}