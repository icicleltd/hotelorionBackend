const Customers = require("../../models/CustomersModel");
const GenerateReportModel = require("./generateReport.model");

exports.createGenerateReport = async (req, res, next) => {
  try {
    const { currentTime, currentDate } = req.body;

    // Validation
    if (!currentTime || !currentDate) {
      return res.status(400).json({
        success: false,
        message: "currentTime and currentDate are required",
      });
    }

    // Get date ranges
    const today = new Date();
    const todayFormatted = today.toISOString().split("T")[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextDateFormatted = tomorrow.toISOString().split("T")[0];

    // Find all currently checked out customers (both normal and early)
    const currentCheckouts = await Customers.find({
      $or: [
        { lastDate: todayFormatted, checkIn: "Checked Out" },
        { lastDate: nextDateFormatted, checkIn: "Checked Out" },
      ],
    });

    if (currentCheckouts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No customers found to generate report",
      });
    }

    // Get the last report for this date
    const lastReport = await GenerateReportModel.findOne({ currentDate })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate the next report sequence number
    const reportSequence = lastReport ? lastReport.reportSequence + 1 : 1;

    // Find only customers who checked out AFTER the last report was created
    let newCheckouts = [];

    if (lastReport) {
      const lastReportTime = new Date(lastReport.createdAt);

      // Get IDs of customers already included in previous reports today
      const allPreviousReports = await GenerateReportModel.find({
        currentDate,
      }).lean();

      // Extract all customer IDs from previous reports
      const previouslyReportedCustomerIds = new Set();
      allPreviousReports.forEach((report) => {
        if (
          report.checkoutCustomers &&
          Array.isArray(report.checkoutCustomers)
        ) {
          report.checkoutCustomers.forEach((customer) => {
            previouslyReportedCustomerIds.add(customer._id.toString());
          });
        }
      });

      // Filter out customers already included in any previous reports
      newCheckouts = currentCheckouts.filter(
        (customer) =>
          !previouslyReportedCustomerIds.has(customer._id.toString())
      );
    } else {
      // If there's no last report, all current checkouts are new
      newCheckouts = currentCheckouts;
    }

    // console.log("New Checkouts:", newCheckouts);

    if (newCheckouts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No new checkouts since last report generation",
        lastReportTime: lastReport?.createdAt,
      });
    }

    // Categorize new checkouts
    const normalNewCheckouts = newCheckouts.filter(
      (c) => c.lastDate === todayFormatted
    );
    const earlyNewCheckouts = newCheckouts.filter(
      (c) => c.lastDate === nextDateFormatted
    );

    // cash amounts from new checkouts
    // console.log("New Checkouts:", newCheckouts);
    // const cashAmounts = newCheckouts

    // Calculate amounts
    const reportData = {
      currentTime,
      currentDate,
      checkoutCustomers: newCheckouts,
      totalCustomers: newCheckouts.length,
      totalAmount: newCheckouts.reduce(
        (sum, c) => sum + (c.paidAmount || 0),
        0
      ),
      earlyCheckedOutCustomerAmount: earlyNewCheckouts.reduce(
        (sum, c) => sum + (c.paidAmount || 0),
        0
      ),
      normalCheckedOutCustomerAmount: normalNewCheckouts.reduce(
        (sum, c) => sum + (c.paidAmount || 0),
        0
      ),
      reportSequence: reportSequence,
      isLatest: true,
    };

    // Create new report
    const newReport = await GenerateReportModel.create(reportData);

    // Mark previous reports as not latest
    if (lastReport) {
      await GenerateReportModel.updateMany(
        { currentDate, _id: { $ne: newReport._id } },
        { $set: { isLatest: false } }
      );
    }

    res.status(201).json({
      success: true,
      message: `New report generated with ${newCheckouts.length} customers`,
      newReport,
      previousReportsCount: reportSequence - 1,
    });
  } catch (error) {
    // console.error("Error generating report:", error);
    next(error);
  }
};

exports.getGenerateReport = async (req, res, next) => {
  try {
    // Create date objects for start and end of current day
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

    // Find reports where createdAt is between start of today and start of tomorrow
    const generateReport = await GenerateReportModel.find({
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Generate Report fetched successfully",
      data: generateReport,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSingleGenerateReport = async (req, res, next) => {
  try {
    const id = req.params.id;
    const generateReport = await GenerateReportModel.findById(id);

    if (!generateReport) {
      return res.status(404).json({
        message: "Generate Report not found",
      });
    }

    // Find current report index and previous report time
    const generatedAllReports = await GenerateReportModel.find({}).sort({
      createdAt: -1,
    });

    // Find the current report's index in array
    const currentReportIndex = generatedAllReports.findIndex(
      (report) => report._id.toString() === id
    );

    let previousReportTime = "01:00 AM"; // Default to 01:00 AM
    let currentReportTime = generateReport.currentTime;
    let currentReportDate = generateReport.currentDate;

    // Get previous report time if available
    if (
      currentReportIndex !== -1 &&
      currentReportIndex + 1 < generatedAllReports.length
    ) {
      const previousReport = generatedAllReports[currentReportIndex + 1];

      // Check if the dates are the same
      if (previousReport.currentDate === currentReportDate) {
        previousReportTime = previousReport.currentTime;
      } else {
        // If dates are different, keep the default "01:00 AM"
        previousReportTime = "01:00 AM";
      }
    }

    // Format time range string
    const formattedTimeRange = `${previousReportTime} - ${currentReportTime}`;

    // Calculate total amount from all customers
    const totalAmount = generateReport?.checkoutCustomers?.reduce(
      (sum, customer) => sum + (customer.paidAmount || 0),
      0
    );

    // Initialize payment method totals
    const paymentMethodTotals = {
      cashAmount: 0,
      cardAmount: 0,
      bkashAmount: 0,
      otherAmount: 0,
    };

    // Calculate totals by payment method
    generateReport?.checkoutCustomers?.forEach((customer) => {
      if (customer.payment && customer.payment.length > 0) {
        customer.payment.forEach((payment) => {
          const amount = payment.amount || 0;

          switch (payment.paymentmethod) {
            case "Cash":
              paymentMethodTotals.cashAmount += amount;
              break;
            case "Card Payment":
              paymentMethodTotals.cardAmount += amount;
              break;
            case "Bkash":
              paymentMethodTotals.bkashAmount += amount;
              break;
            default:
              paymentMethodTotals.otherAmount += amount;
              break;
          }
        });
      }
    });

    // More robust room count calculation
    let countedCustomers = new Set(); // To avoid counting the same customer multiple times

    // Helper function to check room type
    const isRoomType = (customer, type) => {
      const id = customer._id.toString();
      if (countedCustomers.has(id)) return false;

      let matches = false;

      switch (type) {
        case "DS": // Deluxe Single
          matches =
            (customer.bookingroom?.includes("Deluxe Single/Couple") &&
              customer.isSingle === "isSingle") ||
            customer.roomType === "Deluxe Single";
          break;
        case "DC": // Deluxe Couple
          matches =
            (customer.bookingroom?.includes("Deluxe Single/Couple") &&
              (customer.isSingle === "isCouple" ||
                customer.isSingle === "true")) ||
            customer.roomType === "Deluxe Couple";
          break;
        case "DT": // Deluxe Twin
          matches =
            customer.bookingroom?.includes("Deluxe Twin") ||
            customer.roomType === "Deluxe Twin";
          break;
        case "OS": // Orion Suite
          matches =
            customer.bookingroom?.includes("Orion Suite") ||
            customer.roomType === "Orion Suite";
          break;
        case "ES": // Executive Suite
          matches =
            customer.bookingroom?.includes("Executive Suite") ||
            customer.roomType === "Executive Suite";
          break;
        case "RS": // Royal Suite
          matches =
            customer.bookingroom?.includes("Royal Suite") ||
            customer.roomType === "Royal Suite";
          break;
      }

      if (matches) countedCustomers.add(id);
      return matches;
    };

    // Perform room type counts
    const totalDelucxeSingleRoom =
      generateReport?.checkoutCustomers?.filter((customer) =>
        isRoomType(customer, "DS")
      ).length || 0;

    // Reset for next count
    countedCustomers.clear();

    const totalDelucxeCoupleRoom =
      generateReport?.checkoutCustomers?.filter((customer) =>
        isRoomType(customer, "DC")
      ).length || 0;

    countedCustomers.clear();

    const totalDeluxeTwinRoom =
      generateReport?.checkoutCustomers?.filter((customer) =>
        isRoomType(customer, "DT")
      ).length || 0;

    countedCustomers.clear();

    const totalOrionSuiteRoom =
      generateReport?.checkoutCustomers?.filter((customer) =>
        isRoomType(customer, "OS")
      ).length || 0;

    countedCustomers.clear();

    const totalExecutiveSuiteRoom =
      generateReport?.checkoutCustomers?.filter((customer) =>
        isRoomType(customer, "ES")
      ).length || 0;

    countedCustomers.clear();

    const totalRoyalSuiteRoom =
      generateReport?.checkoutCustomers?.filter((customer) =>
        isRoomType(customer, "RS")
      ).length || 0;

    // Add debugging if needed
    // console.log("Room counts:", { DS: totalDelucxeSingleRoom, DC: totalDelucxeCoupleRoom, DT: totalDeluxeTwinRoom });

    // const roomsTypeSummary = {
    //   DS: totalDelucxeSingleRoom,
    //   DC: totalDelucxeCoupleRoom,
    //   DT: totalDeluxeTwinRoom,
    //   OS: totalOrionSuiteRoom,
    //   ES: totalExecutiveSuiteRoom,
    //   RS: totalRoyalSuiteRoom,
    //   total:
    //     totalDelucxeSingleRoom +
    //     totalDelucxeCoupleRoom +
    //     totalDeluxeTwinRoom +
    //     totalOrionSuiteRoom +
    //     totalExecutiveSuiteRoom +
    //     totalRoyalSuiteRoom,
    // };

    const roomsTypeSummary = [
      {
        type: "DS",
        label: "Deluxe Single",
        count: totalDelucxeSingleRoom || 0,
      },
      {
        type: "DC",
        label: "Deluxe Couple",
        count: totalDelucxeCoupleRoom || 0,
      },
      { type: "DT", label: "Deluxe Twin", count: totalDeluxeTwinRoom || 0 },
      { type: "OS", label: "Orion Suite", count: totalOrionSuiteRoom || 0 },
      {
        type: "ES",
        label: "Executive Suite",
        count: totalExecutiveSuiteRoom || 0,
      },
      { type: "RS", label: "Royal Suite", count: totalRoyalSuiteRoom || 0 },
      {
        totalRoomCount:
          totalDelucxeSingleRoom +
          totalDelucxeCoupleRoom +
          totalDeluxeTwinRoom +
          totalOrionSuiteRoom +
          totalExecutiveSuiteRoom +
          totalRoyalSuiteRoom,
      },
    ];

    const result = {
      totalAmount: totalAmount || 0,
      paymentMethodTotals: {
        cashAmount: paymentMethodTotals.cashAmount || 0,
        cardAmount: paymentMethodTotals.cardAmount || 0,
        bkashAmount: paymentMethodTotals.bkashAmount || 0,
        otherAmount: paymentMethodTotals.otherAmount || 0,
      },
      reportTimeRange: formattedTimeRange,
      currentTime: generateReport.currentTime,
      roomsTypeSummary: roomsTypeSummary,
      customerList: generateReport?.checkoutCustomers || [],
    };

    res.status(200).json({
      message: "Generate Report fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteGenerateReport = async (req, res, next) => {
  try {
    const id = req.params.id;
    const generateReport = await GenerateReportModel.findByIdAndDelete(id);

    if (!generateReport) {
      return res.status(404).json({
        message: "Generate Report not found",
      });
    }

    res.status(200).json({
      message: "Generate Report deleted successfully",
      success: true,
      status: 200,
      data: generateReport,
    });
  } catch (error) {
    next(error);
  }
};
