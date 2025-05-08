const Bookings = require("../models/bookingsModel");
const ComplaintRoomModel = require("../models/complaintRoomModel");
const Daylong = require("../models/DaylongModel");
const HouseKeepingModel = require("../models/housekeepingModel");
const OnlineBooking = require("../models/OnlineBookingModel");
const Rooms = require("../models/RoomsModel");

exports.createRooms = async (req, res, next) => {
  try {
    const rooms = await Rooms.create(req.body);
    res.status(200).json({
      message: "Rooms added successfully",
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

exports.getRooms = async (req, res, next) => {
  try {
    const date = req.query.date;

    const options = await Rooms.find().sort({ createdAt: 1 });
    const todaydaylongs = await Rooms.find().sort({ createdAt: -1 });

    const overlappingBookings = await Bookings.find({
      $or: [
        { firstDate: { $lte: date }, lastDate: { $gt: date } },
        { firstDate: { $lte: date }, lastDate: null },
        { firstDate: null, lastDate: { $gt: date } },
      ],
    });

    const overlappingDaylongs = await Daylong.find({
      $or: [{ bookingDate: date }, { previousDate: date }],
    });

    const overlappingpTodayDaylongs = await Daylong.find({
      bookingDate: date,
    });

    todaydaylongs.forEach((option) => {
      const bookedRoomNumbersFromBookings = overlappingBookings
        .filter((book) => {
          const roomget = book.bookingroom.map((room) => room === option.roomname);
          return roomget;
        })
        .map((book) => book.roomNumber.map((item) => item))
        .flat();

      const bookedRoomNumbersFromDaylongs = overlappingpTodayDaylongs
        .filter((daylong) => {
          const daylongroomget = daylong?.roomType?.map((room) => room === option.roomname);
          return daylongroomget;
        })
        .map((daylong) => daylong.roomsNumber.map((item2) => item2))
        .flat();

      const bookedRoomNumbers = [
        ...bookedRoomNumbersFromBookings,
        ...bookedRoomNumbersFromDaylongs,
      ];
      option.roomnumber = option.roomnumber.filter((room) => !bookedRoomNumbers.includes(room));
    });

    options.forEach((option) => {
      const bookedRoomNumbersFromBookings = overlappingBookings
        .filter((book) => {
          const roomget = book.bookingroom.map((room) => room === option.roomname);
          return roomget;
        })
        .map((book) => book.roomNumber.map((item) => item))
        .flat();

      const bookedRoomNumbersFromDaylongs = overlappingDaylongs
        .filter((daylong) => {
          const daylongroomget = daylong?.roomType?.map((room) => room === option.roomname);
          return daylongroomget;
        })
        .map((daylong) => daylong.roomsNumber.map((item2) => item2))
        .flat();

      const bookedRoomNumbers = [
        ...bookedRoomNumbersFromBookings,
        ...bookedRoomNumbersFromDaylongs,
      ];
      option.roomnumber = option.roomnumber.filter((room) => !bookedRoomNumbers.includes(room));
    });

    res.status(200).json({
      message: "Rooms get successfully",
      data: options,
      daylong: overlappingDaylongs,
      todaysDaylong: todaydaylongs,
    });
  } catch (error) {
    next(error);
  }
};

//get rooms by date range
exports.getRoomsByDateRange = async (req, res, next) => {
  try {
    const { firstdate, lastdate } = req.query;
    const options = await Rooms.find();

    // Find overlapping bookings
    const overlappingBookings = await Bookings.find({
      $or: [
        { firstDate: { $lte: lastdate }, lastDate: { $gte: firstdate } },
        { firstDate: { $lte: lastdate }, lastDate: null },
        { firstDate: null, lastDate: { $gt: firstdate } },
      ],
    });

    // console.log(overlappingBookings, 117)

    // Find overlapping daylong bookings
    const overlappingdaylong = await Daylong.find({
      bookingDate: { $gte: firstdate, $lte: lastdate },
    });

    const overlappingdaylongprevious = await Daylong.find({
      previousDate: { $gte: firstdate, $lte: lastdate },
    });

    // Get room status information from roomsColorStatus
    const todayFormatted = new Date().toISOString().split('T')[0];
    
    // Find rooms with specific statuses
    const registeredAndTodayCheckout = [];
    const registeredAndNotTodayCheckout = [];
    const previousRegisteredAndNotTodayCheckout = [];
    const bookingRooms = {}; // Date-wise tracking
    const housekeepingAllRooms = [];
    const complaintsAllRooms = [];
    

    // Process registered bookings to populate status arrays
    overlappingBookings.forEach((booking) => {
      // console.log(booking, 140)
      if (booking.isRegistered) {
        const roomNumbers = Array.isArray(booking.roomNumber) 
          ? booking.roomNumber 
          : booking.roomNumber.split(',').map(room => room.trim());
          
        if (booking.isTodayCheckout === true) {

          registeredAndTodayCheckout.push(...roomNumbers);
        } else if (booking.firstDate === todayFormatted) {
          registeredAndNotTodayCheckout.push(...roomNumbers);
        } else if (booking.firstDate < todayFormatted && booking.lastDate > todayFormatted) {
          previousRegisteredAndNotTodayCheckout.push(...roomNumbers);
        }
      }
    });

    // console.log(registeredAndTodayCheckout)

    
    // Get online bookings for date tracking
    const onlineBookings = await OnlineBooking.find({
      isBookings: true,
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
    
    // Get housekeeping rooms
    const housekeepingRooms = await HouseKeepingModel.find({
      isCleaning: true,
    });
    
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
    
    // Get complaint rooms
    const complaintRooms = await ComplaintRoomModel.find({
      isComplaints: true,
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
    
    // Remove duplicates from each status array
    const uniqueRegisteredAndTodayCheckout = [...new Set(registeredAndTodayCheckout)];
    const uniqueRegisteredAndNotTodayCheckout = [...new Set(registeredAndNotTodayCheckout)];
    const uniquePreviousRegisteredAndNotTodayCheckout = [...new Set(previousRegisteredAndNotTodayCheckout)];
    

    // console.log("uniqueRegisteredAndTodayCheckout", uniqueRegisteredAndTodayCheckout, 237);
    // console.log("uniqueRegisteredAndNotTodayCheckout", uniqueRegisteredAndNotTodayCheckout, 237);
    // console.log("uniquePreviousRegisteredAndNotTodayCheckout", uniquePreviousRegisteredAndNotTodayCheckout, 237);

    // Get all booking rooms dates in the requested range
    const dateFilteredRooms = [];
    Object.keys(bookingRooms).forEach(date => {
      if (date >= firstdate && date <= lastdate) {
        dateFilteredRooms.push(...bookingRooms[date]);
      }
    });
    
    const uniqueBookingRooms = [...new Set(dateFilteredRooms)];
    const uniqueHousekeepingRooms = [...new Set(housekeepingAllRooms)];
    const uniqueComplaintRooms = [...new Set(complaintsAllRooms)];

    // console.log(uniqueRegisteredAndTodayCheckout, 253)
    
    // Combine all room numbers that should be excluded
    const allExcludedRooms = [
      ...uniqueRegisteredAndTodayCheckout,
      ...uniqueRegisteredAndNotTodayCheckout,
      ...uniquePreviousRegisteredAndNotTodayCheckout,
      ...uniqueBookingRooms,
      ...uniqueHousekeepingRooms,
      ...uniqueComplaintRooms
    ];

    // console.log(allExcludedRooms, "allExcludedRooms", 274)
    
    // Get unique excluded rooms
    const uniqueExcludedRooms = [...new Set(allExcludedRooms)];

    options.forEach((option) => {
      // Get all booked room numbers from bookings
      const bookedRoomNumbersFromBookings = overlappingBookings
        .filter((book) => book.bookingroom.includes(option.roomname))
        .flatMap((book) => book.roomNumber);

      // Get all booked room numbers from daylongs booking date
      const bookedRoomNumbersFromDaylongs = overlappingdaylong
        .filter((daylong) => daylong?.roomType?.some((room) => room === option?.roomname))
        .map((daylong) => daylong?.roomsNumber);

      // Get all booked room numbers from daylongs previous date
      const bookedRoomNumbersFromDaylongsPrevious = overlappingdaylongprevious
        .filter((daylong) => daylong?.roomType?.some((room) => room === option?.roomname))
        .map((daylong) => daylong?.roomsNumber);

      // Combine all booked room numbers
      const allBookedRoomNumbers = [
        ...bookedRoomNumbersFromBookings.flat(),
        ...bookedRoomNumbersFromDaylongs.flat(),
        ...bookedRoomNumbersFromDaylongsPrevious.flat(),
      ];
      
      // Filter out both booked rooms and rooms with specific statuses
      option.roomnumber = option.roomnumber.filter(
        (room) => !allBookedRoomNumbers.includes(room) && !uniqueExcludedRooms.includes(room)
      );
    });

    

    res.status(200).json({
      message: "Rooms get successfully",
      data: options,
    });
  } catch (error) {
    next(error);
  }
};
