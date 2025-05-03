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

    const result = {
      customerList: generateReport?.checkoutCustomers || [],
      totalAmount: totalAmount || 0,
      paymentMethodTotals: {
        cashAmount: paymentMethodTotals.cashAmount || 0,
        cardAmount: paymentMethodTotals.cardAmount || 0,
        bkashAmount: paymentMethodTotals.bkashAmount || 0,
        otherAmount: paymentMethodTotals.otherAmount || 0,
      },
    };

    res.status(200).json({
      message: "Generate Report fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
