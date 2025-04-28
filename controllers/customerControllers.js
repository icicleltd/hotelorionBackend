const Bookings = require("../models/bookingsModel");
const Customers = require("../models/CustomersModel");

exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await Customers.find().sort({ createdAt: -1 });
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
    // Get today's date in Dhaka timezone
    const timeZone = "Asia/Dhaka";
    const currentDate = new Date();

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

    // Format as YYYY-MM-DD for database queries
    const todayFormatted = `${dateParts[2]}-${dateParts[0].padStart(
      2,
      "0"
    )}-${dateParts[1].padStart(2, "0")}`;

    // Find bookings that have today as their lastDate (checkout date)
    const todayCheckouts = await Bookings.find({
      lastDate: todayFormatted,
      isRegistered: true,
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
exports.getTodayCheckoutCount = async (req, res, next) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCheckouts = await Customers.find({
      // Option 1: If you have a specific checkout timestamp field
      // checkOutTime: { $gte: today, $lte: endOfDay }

      // Option 2: If you use the "checkIn" status field
      checkIn: "Checked Out",
      updatedAt: { $gte: today, $lte: endOfDay },
    });

    const result = todayCheckouts.reduce((acc, customer) => {
      if (!acc[customer.roomNumber]) {
        acc[customer.roomNumber] = 1;
      } else {
        acc[customer.roomNumber] += 1;
      }
      return acc;
    }, {});

    const checkoutCount = Object.keys(result).map((roomNumber) => ({
      roomNumber,
      count: result[roomNumber],
    }));

    res.status(200).json({
      success: true,
      status: 200,
      message: "Today's checkouts count retrieved successfully",
      count: checkoutCount.length,
      data: checkoutCount,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDueCheckoutsCustomers = async (req, res, next) => {
  try {
    const dueCheckout = await Customers.find({
      dueAmount: { $gt: 0 },
      checkIn: "Checked Out",
    }).sort({ createdAt: -1 });

    // console.log(dueCheckout);

    res.status(200).json({
      message: "Due checkout customers retrieved successfully",
      success: true,
      status: 200,
      count: dueCheckout.length,
      data: dueCheckout,
    });
  } catch (error) {
    next(error);
  }
};

exports.addDueAmountFromCustomer = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { payment } = req.body;

    const existingCustomer = await Customers.findById(id);
    if (!existingCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Calculate the current total paid amount (sum all payment amounts)
    const currentTotalPaid =
      existingCustomer.payment.reduce(
        (sum, paymentItem) => sum + (paymentItem.amount || 0),
        0
      ) + (payment.amount || 0);

    // Calculate the new due amount based on beforeDiscountCost
    const newDueAmount = existingCustomer.beforeDiscountCost - currentTotalPaid;

    // Add the payment to the payment array and update paidAmount and dueAmount
    const updatedCustomer = await Customers.findByIdAndUpdate(
      id,
      {
        $push: { payment: payment },
        $set: {
          paidAmount: currentTotalPaid,
          dueAmount: newDueAmount >= 0 ? newDueAmount : 0, // Ensure due amount is never negative
        },
      },
      { new: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({
      message: "Payment processed successfully",
      data: updatedCustomer,
    });
  } catch (error) {
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
