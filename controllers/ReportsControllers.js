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
      createdAt: { $gte: today, $lte: endOfDay },
    });

    // Find bookings created today
    const todayBookings = await Bookings.find({
      createdAt: { $gte: today, $lte: endOfDay },
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
      date: today.toISOString().split("T")[0],
      customersCount,
      bookingsCount,
      newRoomAmount,
      customerRevenue,
      totalRevenue,
      recentCustomers: todayCustomers,
      recentBookings: todayBookings,
    };

    res.status(200).json({
      message: "Live report retrieved successfully",
      data: liveReportData,
    });
  } catch (error) {
    console.log(error);
    // Make sure to use the next parameter for error handling
    next(error);
  }
};

exports.getDailyReport = async (req, res, next) => {
  try {
    // Get the current date or use provided date from request
    const requestDate = req.query.date ? new Date(req.query.date) : new Date();
    const targetDate = new Date(requestDate);
    targetDate.setHours(0, 0, 0, 0); // Set to start of the day

    // Set end of day time
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find customers created on the target date
    const todayCustomers = await Customers.find({
      createdAt: { $gte: targetDate, $lte: endOfDay },
    });

    // Find bookings created on the target date
    const todayBookings = await Bookings.find({
      createdAt: { $gte: targetDate, $lte: endOfDay },
    });

    // Get count of customers and bookings
    const customersCount = todayCustomers.length;
    const bookingsCount = todayBookings.length;

    // Initialize payment method totals
    const paymentSummary = {
      totalAmount: 0,
      cashAmount: 0,
      bankTransferAmount: 0,
      creditCardAmount: 0,
      bkashAmount: 0,
      duePaymentAmount: 0,
    };

    // Process bookings to calculate payment method totals
    todayBookings.forEach((booking) => {
      // Add to total amount (paid + due)
      const paidAmount = booking.paidAmount || 0;
      const dueAmount = booking.dueAmount || 0;
      
      paymentSummary.totalAmount += paidAmount;
      paymentSummary.duePaymentAmount += dueAmount;
      
      // Process payment array to categorize by payment method
      if (booking.payment && Array.isArray(booking.payment)) {
        booking.payment.forEach(payment => {
          const amount = payment.amount || 0;
          const method = payment.paymentmethod?.toLowerCase() || '';
          
          if (method.includes('cash')) {
            paymentSummary.cashAmount += amount;
          } else if (method.includes('bkash')) {
            paymentSummary.bkashAmount += amount;
          } else if (method.includes('card')) {
            paymentSummary.creditCardAmount += amount;
          } else if (method.includes('bank') || method.includes('transfer')) {
            paymentSummary.bankTransferAmount += amount;
          }
        });
      } else {
        // Default to cash if no payment array but has paid amount
        if (paidAmount > 0) {
          paymentSummary.cashAmount += paidAmount;
        }
      }
    });

    // Process customers with payment information
    todayCustomers.forEach((customer) => {
      // Process payment array if exists
      if (customer.payment && Array.isArray(customer.payment)) {
        customer.payment.forEach((payment) => {
          const amount = payment.amount || 0;
          paymentSummary.totalAmount += amount;

          // Categorize by payment method
          switch (payment.method?.toLowerCase()) {
            case "cash":
              paymentSummary.cashAmount += amount;
              break;
            case "bank":
            case "bank transfer":
              paymentSummary.bankTransferAmount += amount;
              break;
            case "card":
            case "credit card":
              paymentSummary.creditCardAmount += amount;
              break;
            case "bkash":
              paymentSummary.bkashAmount += amount;
              break;
            case "due":
            case "due payment":
              paymentSummary.duePaymentAmount += amount;
              break;
            default:
              // Default to cash if method not specified
              paymentSummary.cashAmount += amount;
          }
        });
      }
      // If customer has direct paidAmount but no payment array
      else if (customer.paidAmount) {
        const amount = customer.paidAmount;
        paymentSummary.totalAmount += amount;
        paymentSummary.cashAmount += amount; // Default to cash
      }
    });

    // Room type mapping function
    const getRoomTypeAbbreviation = (roomType) => {
      if (!roomType) return '';
      
      const type = roomType.toLowerCase();
      if (type.includes('deluxe single') || type.includes('deluxe couple')) return 'DS';
      if (type.includes('deluxe twin')) return 'DT';
      if (type.includes('orion suite')) return 'OS';
      if (type.includes('executive suite')) return 'ES';
      if (type.includes('royal suite')) return 'RS';
      return '';
    };

    // Count rooms by type
    const roomStats = {
      DS: 0, // Deluxe Single/Couple
      DT: 0, // Deluxe Twin
      OS: 0, // Orion Suite
      ES: 0, // Executive Suite
      RS: 0, // Royal Suite
      total: 0 // Total rooms booked
    };

    // Process each booking to count room types
    todayBookings.forEach((booking) => {
      // Skip if no bookingroom array
      if (!booking.bookingroom || !Array.isArray(booking.bookingroom)) return;
      
      // Process each room in the booking
      booking.bookingroom.forEach(roomType => {
        const abbr = getRoomTypeAbbreviation(roomType);
        if (abbr && roomStats.hasOwnProperty(abbr)) {
          roomStats[abbr]++;
          roomStats.total++;
        }
      });
    });

    // Create an array of room types for each booking (for rendering in report)
    let roomTypesMapped = [];
    todayBookings.forEach((booking) => {
      if (!booking.bookingroom || !Array.isArray(booking.bookingroom)) return;
      
      // Map room types to abbreviations
      const bookingRoomTypes = booking.bookingroom.map(roomType => 
        getRoomTypeAbbreviation(roomType)
      ).filter(abbr => abbr); // Filter out empty abbreviations
      
      // Add booking ID and room types to the mapping
      if (bookingRoomTypes.length > 0) {
        roomTypesMapped.push({
          bookingId: booking.bookingId,
          roomTypes: bookingRoomTypes
        });
      }
    });

    // Prepare the daily report data
    const dailyReportData = {
      date: targetDate.toISOString().split("T")[0],
      customersCount,
      bookingsCount,
      paymentSummary,
      roomStats,
      roomTypesMapped,
      bookings: todayBookings.map((booking) => {
        // Get room type abbreviations
        const rtAbbreviations = booking.bookingroom?.map(rt => 
          getRoomTypeAbbreviation(rt)
        ).filter(abbr => abbr).join(', ') || '';
        
        // Calculate total payment amounts
        let cashAmount = 0;
        let bkashAmount = 0;
        let cardAmount = 0;
        let bankAmount = 0;
        
        // Process payment array if it exists
        if (booking.payment && Array.isArray(booking.payment)) {
          booking.payment.forEach(payment => {
            const amount = payment.amount || 0;
            const method = payment.paymentmethod?.toLowerCase() || '';
            
            if (method.includes('cash')) {
              cashAmount += amount;
            } else if (method.includes('bkash')) {
              bkashAmount += amount;
            } else if (method.includes('card')) {
              cardAmount += amount;
            } else if (method.includes('bank')) {
              bankAmount += amount;
            }
          });
        } else if (booking.paidAmount) {
          // Default to cash if payment array doesn't exist
          cashAmount = booking.paidAmount;
        }
        
        return {
          csl: booking.bookingId,
          rt: rtAbbreviations,
          rn: Array.isArray(booking.roomNumber) ? booking.roomNumber.join(', ') : booking.roomNumber || '',
          guestName: booking.customerName,
          roomRent: booking.beforeDiscountCost || 0,
          payRent: booking.paidAmount || 0,
          cash: cashAmount,
          bkash: bkashAmount,
          card: cardAmount,
          bank: bankAmount,
          due: booking.dueAmount || 0,
          night: booking.firstDate && booking.lastDate ? 
            Math.max(1, Math.ceil(Math.abs(
              new Date(booking.lastDate) - new Date(booking.firstDate)
            ) / (1000 * 60 * 60 * 24))) : 1,
          remark: booking.checkIn || ''
        };
      }),
      // Include summarized customer data (excluding sensitive info)
      customers: todayCustomers.map((customer) => ({
        id: customer._id,
        name: customer.name || customer.customerName,
        contactInfo: customer.phone || customer.customerNumber || customer.email || '',
        paidAmount: customer.paidAmount || 0,
      })),
    };

    res.status(200).json({
      success: true,
      message: "Daily report retrieved successfully",
      data: dailyReportData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching daily report",
      error: error.message,
    });
  }
};

// Add a new function for custom date range reports
exports.getDateRangeReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Both startDate and endDate are required",
      });
    }

    // Parse and validate dates
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use YYYY-MM-DD",
      });
    }

    // Find customers and bookings within date range
    const customers = await Customers.find({
      createdAt: { $gte: startDateTime, $lte: endDateTime },
    });

    const bookings = await Bookings.find({
      createdAt: { $gte: startDateTime, $lte: endDateTime },
    });

    // Initialize payment method totals
    const paymentSummary = {
      totalAmount: 0,
      cashAmount: 0,
      bankTransferAmount: 0,
      creditCardAmount: 0,
      bkashAmount: 0,
      duePaymentAmount: 0,
    };

    // Process bookings to calculate payment method totals (similar to daily report)
    bookings.forEach((booking) => {
      const totalBookingAmount = booking.paidAmount || 0;
      paymentSummary.totalAmount += totalBookingAmount;

      if (booking.cash) paymentSummary.cashAmount += booking.cash;
      if (booking.bank) paymentSummary.bankTransferAmount += booking.bank;
      if (booking.card) paymentSummary.creditCardAmount += booking.card;
      if (booking.bkash) paymentSummary.bkashAmount += booking.bkash;
      if (booking.due) paymentSummary.duePaymentAmount += booking.due;

      if (
        totalBookingAmount > 0 &&
        !booking.cash &&
        !booking.bank &&
        !booking.card &&
        !booking.bkash &&
        !booking.due
      ) {
        paymentSummary.cashAmount += totalBookingAmount;
      }
    });

    // Process customers with payment information (similar to daily report)
    customers.forEach((customer) => {
      if (customer.payment && Array.isArray(customer.payment)) {
        customer.payment.forEach((payment) => {
          const amount = payment.amount || 0;
          paymentSummary.totalAmount += amount;

          switch (payment.method?.toLowerCase()) {
            case "cash":
              paymentSummary.cashAmount += amount;
              break;
            case "bank":
            case "bank transfer":
              paymentSummary.bankTransferAmount += amount;
              break;
            case "card":
            case "credit card":
              paymentSummary.creditCardAmount += amount;
              break;
            case "bkash":
              paymentSummary.bkashAmount += amount;
              break;
            case "due":
            case "due payment":
              paymentSummary.duePaymentAmount += amount;
              break;
            default:
              paymentSummary.cashAmount += amount;
          }
        });
      } else if (customer.paidAmount) {
        const amount = customer.paidAmount;
        paymentSummary.totalAmount += amount;
        paymentSummary.cashAmount += amount;
      }
    });

    // Group bookings by date for trend analysis
    const bookingsByDate = {};
    bookings.forEach((booking) => {
      const dateStr = booking.createdAt.toISOString().split("T")[0];
      if (!bookingsByDate[dateStr]) {
        bookingsByDate[dateStr] = { count: 0, revenue: 0 };
      }
      bookingsByDate[dateStr].count++;
      bookingsByDate[dateStr].revenue += booking.paidAmount || 0;
    });

    // Room type statistics
    const roomTypeStats = bookings.reduce((acc, booking) => {
      const type = booking.roomType?.toLowerCase() || "unknown";
      if (!acc[type]) acc[type] = 0;
      acc[type]++;
      return acc;
    }, {});

    // Prepare report data
    const reportData = {
      dateRange: {
        startDate: startDateTime.toISOString().split("T")[0],
        endDate: endDateTime.toISOString().split("T")[0],
      },
      summary: {
        totalCustomers: customers.length,
        totalBookings: bookings.length,
        paymentSummary,
        roomTypeStats,
      },
      trends: {
        bookingsByDate,
      },
    };

    res.status(200).json({
      success: true,
      message: "Date range report retrieved successfully",
      data: reportData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching date range report",
      error: error.message,
    });
  }
};
