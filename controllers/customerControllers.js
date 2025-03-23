const Customers = require("../models/CustomersModel");

exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await Customers.find();
    res.status(200).json({
      message: "All Customers get successfully",
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};
exports.getTodayCheckouts = async (req, res, next) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); // End of today

    // Find customers who checked out today (if you have a checkOutDate field)
    const todayCheckouts = await Customers.find({
      // Option 1: If you have a specific checkout timestamp field
      // checkOutTime: { $gte: today, $lte: endOfDay }

      // Option 2: If you use the "checkIn" status field
      checkIn: "Checked Out",
      updatedAt: { $gte: today, $lte: endOfDay },
    });

    res.status(200).json({
      message: "Today's checkouts retrieved successfully",
      count: todayCheckouts.length,
      data: todayCheckouts,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const id = req.params.id;
    const deleteCustomer = await Customers.findByIdAndDelete(id);
    if (!deleteCustomer) {
      return res.status(404).json({ message: "Customers not Delete" });
    }
    res.status(200).json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
