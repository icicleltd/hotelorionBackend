const CorporateBooking = require("../models/CorporateBookingModel");
const Customers = require("../models/CustomersModel");
const Daylong = require("../models/DaylongModel");
const OnlineBooking = require("../models/OnlineBookingModel");
const Bookings = require("../models/bookingsModel");
const ComplaintRoomModel = require("../models/complaintRoomModel");
const HouseKeepingModel = require("../models/housekeepingModel");

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
          message: "Invalid date format. Please use YYYY-MM-DD format.",
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

    // Store the date parameter in YYYY-MM-DD format for filtering booking rooms
    const requestedDateFormatted = dateParam || todayFormatted;

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

    // Fetch housekeeping rooms that are being cleaned
    const housekeepingRooms = await HouseKeepingModel.find({
      isCleaning: true,
    });

    // Fetch rooms with complaints
    const complaintRooms = await ComplaintRoomModel.find({
      isComplaints: true,
    });

    // Initialize room category arrays
    const registeredAndTodayCheckout = [];
    const registeredAndNotTodayCheckout = [];
    const previousRegisteredAndNotTodayCheckout = [];
    const bookingRooms = {}; // Changed to object for date-wise tracking
    const housekeepingAllRooms = [];
    const complaintsAllRooms = []; // New array for complaint rooms

    // Process housekeeping rooms
    housekeepingRooms.forEach((room) => {
      if (room.roomName) {
        // Check if roomName is an array and handle accordingly
        if (Array.isArray(room.roomName)) {
          housekeepingAllRooms.push(...room.roomName); // Spread the array
        } else if (typeof room.roomName === "string") {
          // If it's a string, just add it directly
          housekeepingAllRooms.push(room.roomName);
        }
      }
    });

    // Process complaint rooms
    complaintRooms.forEach((item) => {
      if (item.complaintRooms) {
        if (Array.isArray(item.complaintRooms)) {
          // Handle nested arrays by flattening them
          item.complaintRooms.forEach((room) => {
            if (Array.isArray(room)) {
              complaintsAllRooms.push(...room);
            } else {
              complaintsAllRooms.push(room);
            }
          });
        } else if (typeof item.complaintRooms === "string") {
          // Handle comma-separated room numbers if stored as string
          const roomNumbers = item.complaintRooms
            .split(",")
            .map((room) => room.trim());
          complaintsAllRooms.push(...roomNumbers);
        }
      }
    });

    // Helper function to process room numbers
    const processRoomNumbers = (booking, roomNumbers) => {
      if (booking.isTodayCheckout === true) {
        registeredAndTodayCheckout.push(...roomNumbers);
      } else if (booking.firstDate === todayFormatted) {
        registeredAndNotTodayCheckout.push(...roomNumbers);
      } else if (
        booking.firstDate < todayFormatted &&
        booking.lastDate > todayFormatted
      ) {
        previousRegisteredAndNotTodayCheckout.push(...roomNumbers);
      }
    };

    // Process registered bookings
    bookings.forEach((booking) => {
      if (Array.isArray(booking.roomNumber)) {
        processRoomNumbers(booking, booking.roomNumber);
      } else if (typeof booking.roomNumber === "string") {
        const roomNumbers = booking.roomNumber
          .split(",")
          .map((room) => room.trim());
        processRoomNumbers(booking, roomNumbers);
      }
    });

    // Process online bookings (date-wise)
    onlineBookings.forEach((booking) => {
      if (booking.roomNumber) {
        // Get the check-in date from the booking
        const bookingDate = booking.chekinDate || todayFormatted;

        // Initialize array for this date if it doesn't exist
        if (!bookingRooms[bookingDate]) {
          bookingRooms[bookingDate] = [];
        }

        // Process the roomNumber based on its type
        if (typeof booking.roomNumber === "string") {
          // Handle comma-separated room numbers or single room
          const roomNumbers = booking.roomNumber.includes(",")
            ? booking.roomNumber.split(",").map((room) => room.trim())
            : [booking.roomNumber.trim()];
          bookingRooms[bookingDate].push(...roomNumbers);
        } else if (Array.isArray(booking.roomNumber)) {
          // Handle array of room numbers
          bookingRooms[bookingDate].push(...booking.roomNumber);
        } else {
          // Handle other cases (like number) by converting to string
          bookingRooms[bookingDate].push(String(booking.roomNumber));
        }
      }
    });

    // Remove duplicates from each date in bookingRooms
    Object.keys(bookingRooms).forEach((date) => {
      bookingRooms[date] = [...new Set(bookingRooms[date])];
    });

    // Get rooms only for the requested date parameter
    const dateFilteredRooms = bookingRooms[requestedDateFormatted] || [];

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
    const uniqueHousekeepingRooms = [...new Set(housekeepingAllRooms)];
    const uniqueComplaintRooms = [...new Set(complaintsAllRooms)]; // Remove duplicates from complaint rooms

    // Create the roomsColor object
    const roomsColor = {
      registeredAndTodayCheckout: uniqueRegisteredAndTodayCheckout,
      registeredAndNotTodayCheckout: uniqueRegisteredAndNotTodayCheckout,
      previousRegisteredAndNotTodayCheckout:
        uniquePreviousRegisteredAndNotTodayCheckout,
      bookingRooms: dateFilteredRooms, // Only rooms for the requested date
      bookingRoomsByDate: bookingRooms, // Keep full date organization for reference
      housekeepingRooms: uniqueHousekeepingRooms,
      complaintRooms: uniqueComplaintRooms, // Added complaint rooms
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
    // Check if Bookings collection has any documents
    const bookingsCount = await Bookings.countDocuments();

    let serialNumber;

    if (bookingsCount > 0) {
      // If Bookings collection is not empty, use the last booking
      const lastBooking = await Bookings.findOne().sort({ createdAt: -1 });
      serialNumber = lastBooking.bookingId || "0000";
    } else {
      // If Bookings collection is empty, use the last customer
      const lastCustomer = await Customers.findOne().sort({ createdAt: -1 });
      serialNumber = lastCustomer ? lastCustomer.customerId || "0000" : "0000";
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

      // console.log(filteredBookings);
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
    const { bookingId, payment, updateDueAmount, ...otherUpdateData } = req.body;
    // console.log("Request data:", otherUpdateData);
    
    // Find the existing booking to get current payment array
    const existingBooking = await Bookings.findOne({ bookingId });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }
    
    // Set update data
    let updateData = { ...otherUpdateData };
    
    // Handle payment addition if provided
    if (payment) {
      payment.amount = Number(payment.amount || 0);

      // Validate payment amount
      if (isNaN(payment.amount) || payment.amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Payment amount must be a positive number",
        });
      }

      // Validate that payment doesn't exceed due amount
      if (payment.amount > existingBooking.dueAmount) {
        return res.status(400).json({
          success: false,
          message: "Payment amount cannot exceed due amount",
          dueAmount: existingBooking.dueAmount,
          requestedAmount: payment.amount,
        });
      }

      // If payment is approximately equal to due amount, adjust it to be exact
      if (Math.abs(payment.amount - existingBooking.dueAmount) < 0.5) {
        payment.amount = existingBooking.dueAmount;
      }

      // Add the payment to the payment array
      await Bookings.findOneAndUpdate(
        { bookingId },
        { $push: { payment: payment } },
        { new: false }
      );
      
      // Update paid amount
      updateData.paidAmount = existingBooking.paidAmount + payment.amount;
      
      // Calculate new due amount based on the payment
      if (!updateDueAmount) {
        // Only adjust due amount by payment if we're not explicitly setting it
        updateData.dueAmount = Math.max(0, existingBooking.dueAmount - payment.amount);
      }
    }
    
    // If updateDueAmount is true and dueAmount is provided, respect the provided dueAmount
    // Otherwise, keep the existing dueAmount (if no payment) or the payment-adjusted dueAmount
    if (!updateData.dueAmount && !updateDueAmount) {
      // If dueAmount is not part of the update and we're not explicitly updating it,
      // keep the existing value
      delete updateData.dueAmount;
    }

    // console.log("Final update data:", updateData);
    
    // Update the booking with all changes in a single operation
    const updatedBooking = await Bookings.findOneAndUpdate(
      { bookingId },
      updateData,
      { new: true }
    );

    console.log("updatedBooking", updatedBooking);

    // Return the updated booking
    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    next(error);
  }
};

// Helper function to calculate due amount
function calculateDueAmount(
  beforeDiscountCost,
  discountPercentage,
  discountFlat,
  paidAmount
) {
  // Calculate discount amount from percentage
  const percentageDiscount =
    (beforeDiscountCost * (discountPercentage || 0)) / 100;

  // Apply both percentage and flat discounts
  const afterDiscountCost =
    beforeDiscountCost - percentageDiscount - (discountFlat || 0);

  // Calculate due amount (cannot be negative)
  return Math.max(0, afterDiscountCost - paidAmount);
}

exports.updatepayment = async (req, res, next) => {
  try {
    const payment = req.body;
    const bookingId = req.params.id;

    // Verify that payment data is provided
    if (!payment || !payment.amount) {
      return res.status(400).json({
        message: "Valid payment data with amount is required",
      });
    }

    // Find the existing booking
    const existingBooking = await Bookings.findById(bookingId);

    if (!existingBooking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // Add the new payment to the payment array
    const updatedBooking = await Bookings.findByIdAndUpdate(
      bookingId,
      { $push: { payment: payment } },
      { new: true }
    );

    // Calculate total paid amount from all payments
    const totalPaidAmount = updatedBooking.payment.reduce((total, pay) => {
      return total + (Number(pay.amount) || 0);
    }, 0);

    // Update paidAmount and dueAmount in a single operation
    const finalUpdatedBooking = await Bookings.findByIdAndUpdate(
      bookingId,
      {
        paidAmount: totalPaidAmount,
        dueAmount: calculateDueAmount(
          updatedBooking.beforeDiscountCost,
          updatedBooking.discountPercentage,
          updatedBooking.discountFlat,
          totalPaidAmount
        ),
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: finalUpdatedBooking,
    });
  } catch (error) {
    console.log("Payment update error:", error);
    next(error);
  }
};

// Helper function for calculating due amount
function calculateDueAmount(
  beforeDiscountCost,
  discountPercentage,
  discountFlat,
  paidAmount
) {
  // Calculate the final cost after applying discounts
  const percentageDiscount =
    (beforeDiscountCost * (discountPercentage || 0)) / 100;
  const totalDiscount = percentageDiscount + (discountFlat || 0);
  const finalCost = beforeDiscountCost - totalDiscount;

  // Due amount is the remaining balance
  return Math.max(0, finalCost - paidAmount);
}

// exports.dueAmountSubmit = async (req, res, next) => {
//   try {
//     const { bookingId, amount, paymentMethod, payNumber } = req.body;

//     // Check if bookingId and amount are provided
//     if (!bookingId || !amount) {
//       return res.status(400).json({
//         success: false,
//         message: "Booking ID and amount are required",
//       });
//     }

//     // Convert amount to a number
//     const paymentAmount = Number(amount);

//     // Validate amount is a positive number
//     if (isNaN(paymentAmount) || paymentAmount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment amount must be a positive number",
//       });
//     }

//     // 1. Find booking using bookingID
//     const booking = await Bookings.findOne({ bookingId });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     // Validate amount doesn't exceed due amount
//     if (paymentAmount > booking.dueAmount) {
//       return res.status(400).json({
//         success: false,
//         message: "Payment amount cannot exceed due amount",
//         dueAmount: booking.dueAmount,
//       });
//     }

//     // 2. Create a payment object
//     const payment = {
//       paymentmethod: paymentMethod || "Cash",
//       payNumber: payNumber || "",
//       paymentDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
//       amount: paymentAmount,
//     };

//     // If payment is very close to the due amount, set it to exactly the due amount
//     if (Math.abs(paymentAmount - booking.dueAmount) < 0.5) {
//       payment.amount = booking.dueAmount;
//     }

//     // 3. Update booking: add the payment and update the due amount
//     const updatedBooking = await Bookings.findOneAndUpdate(
//       { bookingId },
//       {
//         $push: { payment: payment },
//         $inc: { paidAmount: paymentAmount },
//         $set: {
//           // If payment equals due amount (with small tolerance), set due to 0
//           dueAmount:
//             Math.abs(paymentAmount - booking.dueAmount) < 0.5
//               ? 0
//               : booking.dueAmount - paymentAmount,
//         },
//       },
//       { new: true }
//     );

//     if (!updatedBooking) {
//       return res.status(500).json({
//         success: false,
//         message: "Failed to update booking",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Payment processed successfully",
//       data: updatedBooking,
//     });
//   } catch (error) {
//     console.error("Error in dueAmountSubmit:", error);
//     next(error);
//   }
// };
