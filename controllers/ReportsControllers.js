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


// live report
exports.getLiveReport = async (req, res, next) => {
  try {
    // Get the current date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of the day
    
    // Set end of day time
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Find customers created today
    const todayCustomers = await Customers.find({
      createdAt: { $gte: today, $lte: endOfDay }
    });
    
    // Find bookings created today
    const todayBookings = await Bookings.find({
      createdAt: { $gte: today, $lte: endOfDay }
    });
    
    // Get count of customers and bookings
    const customersCount = todayCustomers.length;
    const bookingsCount = todayBookings.length;
    
    // Calculate revenue from new room bookings
    const newRoomAmount = todayBookings.reduce((sum, booking) => {
      return sum + (booking.paidAmount || 0);
    }, 0);
    
    // Calculate revenue from customers (if they have payment information)
    const customerRevenue = todayCustomers.reduce((sum, customer) => {
      // Check if the customer has payment information
      if (customer.payment && Array.isArray(customer.payment)) {
        // Sum up all payment amounts
        const customerTotal = customer.payment.reduce((paymentSum, payment) => {
          return paymentSum + (payment.amount || 0);
        }, 0);
        return sum + customerTotal;
      }
      // If customer has a direct paidAmount field
      else if (customer.paidAmount) {
        return sum + customer.paidAmount;
      }
      return sum;
    }, 0);
    
    // Calculate total revenue (from both sources)
    const totalRevenue = newRoomAmount + customerRevenue;
    
    // Get the data for response
    const liveReportData = {
      date: today.toISOString().split('T')[0],
      customersCount,
      bookingsCount,
      newRoomAmount,
      customerRevenue,
      totalRevenue,
      recentCustomers: todayCustomers,
      recentBookings: todayBookings
    };
    
    res.status(200).json({
      message: "Live report retrieved successfully",
      data: liveReportData
    });
    
  } catch (error) {
    console.log(error);
    // Make sure to use the next parameter for error handling
    next(error);
  }
};
