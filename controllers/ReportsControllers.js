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

    // Find all bookings (we'll filter payments by date later)
    const allBookings = await Bookings.find({});

    // Find bookings created today
    const todayBookings = await Bookings.find({
      createdAt: { $gte: today, $lte: endOfDay },
    });

    // Find customers who checked out today
    const todayCheckouts = await Customers.find({
      checkIn: "Checked Out",
      updatedAt: { $gte: today, $lte: endOfDay },
    });

    // Find early checkouts (customers who checked in AND out on the same day)
    const earlyCheckouts = todayCheckouts.filter(customer => {
      const checkInDate = new Date(customer.firstDate);
      // Check if customer checked in today (same day as checkout)
      return checkInDate >= today && checkInDate <= endOfDay;
    });

    // Calculate early checkout stats by room
    const roomEarlyCheckoutCounts = earlyCheckouts.reduce((acc, customer) => {
      if (!acc[customer.roomNumber]) {
        acc[customer.roomNumber] = 1;
      } else {
        acc[customer.roomNumber] += 1;
      }
      return acc;
    }, {});

    // Create early checkouts array with room numbers and counts
    const earlyCheckoutStats = Object.keys(roomEarlyCheckoutCounts).map((roomNumber) => ({
      roomNumber,
      count: roomEarlyCheckoutCounts[roomNumber],
    }));

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
        // Sum up all payment amounts for today
        const customerTotal = customer.payment.reduce((paymentSum, payment) => {
          const paymentDate = new Date(payment.paymentDate);
          // Check if payment date is today
          if (paymentDate >= today && paymentDate <= endOfDay) {
            return paymentSum + (payment.amount || 0);
          }
          return paymentSum;
        }, 0);
        return sum + customerTotal;
      }
      // If customer has a direct paidAmount field
      else if (customer.paidAmount) {
        return sum + customer.paidAmount;
      }
      return sum;
    }, 0);
    
    // Calculate payments made today from ALL bookings (not just today's bookings)
    const todayPayments = allBookings.reduce((sum, booking) => {
      if (booking.payment && Array.isArray(booking.payment)) {
        // Sum up all payment amounts made today
        const bookingPaymentsToday = booking.payment.reduce((paymentSum, payment) => {
          const paymentDate = new Date(payment.paymentDate);
          // Check if payment date is today
          if (paymentDate >= today && paymentDate <= endOfDay) {
            return paymentSum + (payment.amount || 0);
          }
          return paymentSum;
        }, 0);
        return sum + bookingPaymentsToday;
      }
      return sum;
    }, 0);

    // Calculate total revenue (including payments made today)
    const totalRevenue = todayPayments + customerRevenue;

    // Get bookings with payments made today
    const bookingsWithTodayPayments = allBookings.filter(booking => {
      if (booking.payment && Array.isArray(booking.payment)) {
        return booking.payment.some(payment => {
          const paymentDate = new Date(payment.paymentDate);
          return paymentDate >= today && paymentDate <= endOfDay;
        });
      }
      return false;
    });

    // Get the data for response
    const liveReportData = {
      date: today.toISOString().split("T")[0],
      customersCount,
      bookingsCount,
      newRoomAmount,
      customerRevenue,
      todayPayments,
      totalRevenue,
      recentCustomers: todayCustomers,
      recentBookings: todayBookings,
      bookingsWithTodayPayments: bookingsWithTodayPayments,
      // Add checkout information
      checkoutsCount: todayCheckouts.length,
      earlyCheckoutsCount: earlyCheckouts.length,
      earlyCheckouts: earlyCheckoutStats
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
    // Import date-fns functions
    const { startOfDay, endOfDay, subDays, format, parseISO } = require('date-fns');
    
    // Get the current date or use provided date from request
    const requestDate = req.query.date ? new Date(req.query.date) : new Date();
    
    // Get the previous day (full 24 hours)
    const previousDay = subDays(startOfDay(requestDate), 1);
    const previousDayEnd = endOfDay(previousDay);

    console.log(`Fetching report for previous day: ${format(previousDay, 'yyyy-MM-dd')} (${previousDay.toISOString()} to ${previousDayEnd.toISOString()})`);

    // Find customers created on the previous day
    const todayCustomers = await Customers.find({
      createdAt: { $gte: previousDay, $lte: previousDayEnd },
    });

    // Find bookings created on the previous day
    const todayBookings = await Bookings.find({
      $or: [
        // Created on previous day
        { createdAt: { $gte: previousDay, $lte: previousDayEnd } },
        // Or has payment on the previous day
        {
          "payment.paymentDate": { 
            $gte: previousDay.toISOString(), 
            $lte: previousDayEnd.toISOString() 
          }
        }
      ]
    });

    console.log(`Found ${todayBookings.length} bookings and ${todayCustomers.length} customers for ${format(previousDay, 'yyyy-MM-dd')}`);

    // Log booking data for inspection
    console.log(`First booking sample:`, JSON.stringify(todayBookings[0], null, 2));

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

    // Room type mapping function - modified to be more flexible
    const getRoomTypeAbbreviation = (roomType) => {
      if (!roomType) return '';
      
      try {
        const type = String(roomType).toLowerCase();
        console.log(`Matching room type: "${type}"`);
        
        if (type.includes('deluxe single') || type.includes('deluxe couple') || type === 'ds') return 'DS';
        if (type.includes('deluxe twin') || type === 'dt') return 'DT';
        if (type.includes('orion suite') || type === 'os') return 'OS';
        if (type.includes('executive suite') || type === 'es') return 'ES';
        if (type.includes('royal suite') || type === 'rs') return 'RS';
        
        // More flexible matching
        if (type.includes('deluxe')) return 'DS';
        if (type.includes('twin')) return 'DT';
        if (type.includes('orion')) return 'OS';
        if (type.includes('executive')) return 'ES';
        if (type.includes('royal')) return 'RS';
        
        console.log(`Could not match "${type}" to any room type`);
        return '';
      } catch (err) {
        console.log(`Error processing room type: ${err.message}`);
        return '';
      }
    };

    // Count rooms by type (only for bookings created on the previous day)
    const roomStats = {
      DS: 0, // Deluxe Single/Couple
      DT: 0, // Deluxe Twin
      OS: 0, // Orion Suite
      ES: 0, // Executive Suite
      RS: 0, // Royal Suite
      total: 0 // Total rooms booked
    };

    // Process bookings to calculate payment method totals for the previous day
    todayBookings.forEach((booking) => {
      // We'll only count payments made on the previous day
      if (booking.payment && Array.isArray(booking.payment)) {
        booking.payment.forEach(payment => {
          const paymentDate = new Date(payment.paymentDate);
          // Only include payments made on the previous day
          if (paymentDate >= previousDay && paymentDate <= previousDayEnd) {
            const amount = payment.amount || 0;
            const method = payment.paymentmethod?.toLowerCase() || '';
            
            // Add to total amount
            paymentSummary.totalAmount += amount;
            
            if (method.includes('cash')) {
              paymentSummary.cashAmount += amount;
            } else if (method.includes('bkash')) {
              paymentSummary.bkashAmount += amount;
            } else if (method.includes('card')) {
              paymentSummary.creditCardAmount += amount;
            } else if (method.includes('bank') || method.includes('transfer')) {
              paymentSummary.bankTransferAmount += amount;
            }
          }
        });
      }

      // Add due amounts for bookings created on the previous day
      if (new Date(booking.createdAt) >= previousDay && new Date(booking.createdAt) <= previousDayEnd) {
        const dueAmount = booking.dueAmount || 0;
        paymentSummary.duePaymentAmount += dueAmount;
      }
    });

    // Process customers with payment information
    todayCustomers.forEach((customer) => {
      // Process payment array if exists
      if (customer.payment && Array.isArray(customer.payment)) {
        customer.payment.forEach((payment) => {
          const paymentDate = new Date(payment.paymentDate);
          // Only include payments made on the previous day
          if (paymentDate >= previousDay && paymentDate <= previousDayEnd) {
            const amount = payment.amount || 0;
            paymentSummary.totalAmount += amount;

            // Categorize by payment method
            const method = payment.method?.toLowerCase() || '';
            if (method.includes('cash')) {
              paymentSummary.cashAmount += amount;
            } else if (method.includes('bkash')) {
              paymentSummary.bkashAmount += amount;
            } else if (method.includes('card') || method.includes('credit')) {
              paymentSummary.creditCardAmount += amount;
            } else if (method.includes('bank') || method.includes('transfer')) {
              paymentSummary.bankTransferAmount += amount;
            } else if (method.includes('due')) {
              paymentSummary.duePaymentAmount += amount;
            } else {
              // Default to cash if method not specified
              paymentSummary.cashAmount += amount;
            }
          }
        });
      }
      // If customer has direct paidAmount but no payment array
      else if (customer.paidAmount && new Date(customer.createdAt) >= previousDay && new Date(customer.createdAt) <= previousDayEnd) {
        const amount = customer.paidAmount;
        paymentSummary.totalAmount += amount;
        paymentSummary.cashAmount += amount; // Default to cash
      }
      
      // Check if customer has room information to include in room stats
      if (customer.roomType) {
        // Handle single room type
        const roomType = typeof customer.roomType === 'string' ? customer.roomType : '';
        const abbr = getRoomTypeAbbreviation(roomType);
        if (abbr && roomStats.hasOwnProperty(abbr)) {
          roomStats[abbr]++;
          roomStats.total++;
        }
      } else if (customer.roomTypes && Array.isArray(customer.roomTypes)) {
        // Handle multiple room types
        customer.roomTypes.forEach(roomType => {
          const abbr = getRoomTypeAbbreviation(roomType);
          if (abbr && roomStats.hasOwnProperty(abbr)) {
            roomStats[abbr]++;
            roomStats.total++;
          }
        });
      }
    });

    // Process each booking to count room types - with additional special case handling
    console.log('Processing room types from bookings...');
    todayBookings.forEach((booking, index) => {
      console.log(`Processing booking ${booking.bookingId}:`, JSON.stringify(booking.bookingroom));
      
      // Check for bookingroom array first
      if (booking.bookingroom && Array.isArray(booking.bookingroom) && booking.bookingroom.length > 0) {
        console.log(`Booking #${index} (${booking.bookingId}) has bookingroom array`);
        
        // Process each room in the booking
        booking.bookingroom.forEach(roomType => {
          const abbr = getRoomTypeAbbreviation(roomType);
          console.log(`  Room type: "${roomType}" maps to abbreviation: "${abbr}"`);
          
          if (abbr && roomStats.hasOwnProperty(abbr)) {
            roomStats[abbr]++;
            roomStats.total++;
            console.log(`  Incremented ${abbr} count to ${roomStats[abbr]}`);
          } else {
            console.log(`  Could not map "${roomType}" to a valid room abbreviation`);
          }
        });
      } 
      // Alternative: Check if there's a special roomType array
      else if (booking.roomType && Array.isArray(booking.roomType) && booking.roomType.length > 0) {
        console.log(`Booking #${index} (${booking.bookingId}) has roomType array instead:`, booking.roomType);
        
        booking.roomType.forEach(roomType => {
          const abbr = getRoomTypeAbbreviation(roomType);
          console.log(`  Room type: "${roomType}" maps to abbreviation: "${abbr}"`);
          
          if (abbr && roomStats.hasOwnProperty(abbr)) {
            roomStats[abbr]++;
            roomStats.total++;
            console.log(`  Incremented ${abbr} count to ${roomStats[abbr]}`);
          }
        });
      }
      // Special case: If no room arrays but has firstDate and lastDate, assume it's a valid booking
      else if (booking.firstDate && booking.lastDate) {
        // If no room type info but has booking dates, check if there's a default room type
        console.log(`Booking #${index} (${booking.bookingId}) has no room arrays but has dates, using default detection`);
        
        // Try to infer the room type from other data
        let inferredRoomType = null;
        
        if (booking.roomNumber && Array.isArray(booking.roomNumber)) {
          const roomNum = booking.roomNumber[0];
          if (roomNum) {
            console.log(`  Trying to infer room type from room number: ${roomNum}`);
            // Could add logic here to map room numbers to types if your hotel has a pattern
            // For now, defaulting to DS as a fallback for any valid booking
            inferredRoomType = 'DS';
          }
        }
        
        if (!inferredRoomType && booking.bookingId) {
          // If we still don't have a room type but it's a valid booking, use DS as default
          console.log(`  No room type found, using default DS for valid booking`);
          inferredRoomType = 'DS';
        }
        
        if (inferredRoomType) {
          const abbr = getRoomTypeAbbreviation(inferredRoomType);
          if (abbr && roomStats.hasOwnProperty(abbr)) {
            roomStats[abbr]++;
            roomStats.total++;
            console.log(`  Used fallback room type detection. Incremented ${abbr} count to ${roomStats[abbr]}`);
          }
        }
      } else {
        console.log(`Booking #${index} (${booking.bookingId}) has no usable room information`);
      }
    });

    // Log to debugging information
    console.log('Room stats:', JSON.stringify(roomStats));
    console.log('Payment summary:', JSON.stringify(paymentSummary));

    // Create an array of room types for each booking (for rendering in report)
    let roomTypesMapped = [];
    todayBookings.forEach((booking) => {
      // Try to get room types from bookingroom array
      let bookingRoomTypes = [];
      
      if (booking.bookingroom && Array.isArray(booking.bookingroom)) {
        bookingRoomTypes = booking.bookingroom.map(roomType => 
          getRoomTypeAbbreviation(roomType)
        ).filter(abbr => abbr); // Filter out empty abbreviations
      }
      // Try alternative roomType array if needed
      else if (booking.roomType && Array.isArray(booking.roomType)) {
        bookingRoomTypes = booking.roomType.map(roomType => 
          getRoomTypeAbbreviation(roomType)
        ).filter(abbr => abbr);
      }
      // Fallback for bookings with dates but no room type info
      else if (booking.firstDate && booking.lastDate) {
        bookingRoomTypes = ['DS']; // Default to DS
      }
      
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
      date: format(previousDay, 'yyyy-MM-dd'),
      customersCount,
      bookingsCount,
      paymentSummary,
      roomStats,
      roomTypesMapped,
      bookings: todayBookings.map((booking) => {
        // Get room type abbreviations - with fallbacks
        let rtAbbreviations = '';
        
        if (booking.bookingroom && Array.isArray(booking.bookingroom)) {
          rtAbbreviations = booking.bookingroom.map(rt => 
            getRoomTypeAbbreviation(rt)
          ).filter(abbr => abbr).join(', ');
        } else if (booking.roomType && Array.isArray(booking.roomType)) {
          rtAbbreviations = booking.roomType.map(rt => 
            getRoomTypeAbbreviation(rt)
          ).filter(abbr => abbr).join(', ');
        } else if (booking.firstDate && booking.lastDate) {
          rtAbbreviations = 'DS'; // Default
        }
        
        // Calculate total payment amounts for the previous day only
        let cashAmount = 0;
        let bkashAmount = 0;
        let cardAmount = 0;
        let bankAmount = 0;
        
        // Process payment array if it exists
        if (booking.payment && Array.isArray(booking.payment)) {
          booking.payment.forEach(payment => {
            const paymentDate = new Date(payment.paymentDate);
            // Only include payments made on the previous day
            if (paymentDate >= previousDay && paymentDate <= previousDayEnd) {
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
            }
          });
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
          remark: booking.checkIn || '',
          paymentDates: booking.payment ? booking.payment.map(p => p.paymentDate) : []
        };
      }),
      // Include complete customer data
      customers: todayCustomers,
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
