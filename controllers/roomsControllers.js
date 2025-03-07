const Bookings = require("../models/bookingsModel");
const Daylong = require("../models/DaylongModel");
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

    const overlappingBookings = await Bookings.find({
      $or: [
        { firstDate: { $lte: lastdate }, lastDate: { $gt: firstdate } },
        { firstDate: { $lte: lastdate }, lastDate: null },
        { firstDate: null, lastDate: { $gt: firstdate } },
      ],
    });

    const overlappingdaylong = await Daylong.find({
      bookingDate: { $gte: firstdate, $lte: lastdate },
    });

    const overlappingdaylongprevious = await Daylong.find({
      previousDate: { $gte: firstdate, $lte: lastdate },
    });

    options.forEach((option) => {
      //all booked room numbers from bookings
      const bookedRoomNumbersFromBookings = overlappingBookings
        .filter((book) => book.bookingroom.includes(option.roomname))
        .flatMap((book) => book.roomNumber);

      //all booked room numbers from daylongs booking date
      const bookedRoomNumbersFromDaylongs = overlappingdaylong
        .filter((daylong) => daylong?.roomType?.some((room) => room === option?.roomname))
        .map((daylong) => daylong?.roomsNumber);

      //all booked room numbers from daylongs previous date
      const bookedRoomNumbersFromDaylongsPrevious = overlappingdaylongprevious
        .filter((daylong) => daylong?.roomType?.some((room) => room === option?.roomname))
        .map((daylong) => daylong?.roomsNumber);

      const allBookedRoomNumbers = [
        ...bookedRoomNumbersFromBookings.flat(),
        ...bookedRoomNumbersFromDaylongs.flat(),
        ...bookedRoomNumbersFromDaylongsPrevious.flat(),
      ];

      option.roomnumber = option.roomnumber.filter((room) => !allBookedRoomNumbers.includes(room));
    });

    res.status(200).json({
      message: "Rooms get successfully",
      data: options,
    });
  } catch (error) {
    next(error);
  }
};
