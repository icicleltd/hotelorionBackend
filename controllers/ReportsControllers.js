const Customers = require("../models/CustomersModel");
const Bookings = require("../models/bookingsModel");

exports.findreports = async (req, res) => {
  try {
    const { firstdate, lastdate } = req.body;
    const customers = await Customers.find({
      createdAt: { $gte: firstdate, $lte: lastdate },
    });

    const bookings = await Bookings.find({
      createdAt: { $gte: firstdate, $lte: lastdate },
    });
    const data = [...customers, ...bookings];

    res.status(200).json({
      message:
        customers.length === 0 && bookings.length === 0
          ? "There Are no Customers"
          : "All Customers get successfully",
      data: data,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
