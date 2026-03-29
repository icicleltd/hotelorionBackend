const express = require("express");
const cors = require("cors");

// Routes
const auth = require("./routes/auth");
const rooms = require("./routes/rooms");
const bookings = require("./routes/bookings");
const customers = require("./routes/customers");
const reports = require("./routes/reports");
const onlinebooking = require("./routes/onlineBooking");
const contacts = require("./routes/contacts");
const daylong = require("./routes/Daylong");
const corporate = require("./routes/corporateBookings");

const bookingGuestRoute = require("./modules/BookingGuest/bookingGuest.routes");
const housekeepingRouter = require("./routes/housekeeping");
const complaintsRouter = require("./routes/complaintRoutes");
const LogBookRoutes = require("./modules/LogBook/logbook.routes");
const ExtraPaymentRoutes = require("./modules/ExtraPayment/extraPayment.routes");
const ExtraPaymentItemRoutes = require("./modules/ExtraPayment/ExtraPaymentItem/extraPaymentItem.routes");
const CardPaymentItemRoutes = require("./modules/ExtraPayment/CardPayments/cardPaymentItem.routes");
const GenerateReportRoutes = require("./modules/GenerateReport/generateReport.routes");
const SMSGatewayRoutes = require("./modules/SMSGateway/smsGatewat.routes");
const HousekeeperNameRoutes = require("./modules/HousekeeperName/housekeeperName.routes");
const DutyOnBoardRoutes = require("./modules/RosteringManage/DutyOnBoard/dutyOnBoard.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", auth);
app.use("/api/rooms", rooms);
app.use("/api/bookings", bookings);
app.use("/api/onlinebooking", onlinebooking);
app.use("/api/customers", customers);
app.use("/api/reports", reports);
app.use("/api/housekeeping", housekeepingRouter);
app.use("/api/complaints", complaintsRouter);
app.use("/api/contacts", contacts);
app.use("/api/daylong", daylong);
app.use("/api/corporate", corporate);

app.use("/api/booking-guest", bookingGuestRoute);
app.use("/api/logbooks", LogBookRoutes);

app.use("/api/extrapayment", ExtraPaymentRoutes);
app.use("/api/extrapayment-item", ExtraPaymentItemRoutes);
app.use("/api/card-payment-item", CardPaymentItemRoutes);

app.use("/api/generate-report", GenerateReportRoutes);
app.use("/api/sms-gateway", SMSGatewayRoutes);
app.use("/api/housekeeper-name", HousekeeperNameRoutes);
app.use("/api/duty-on-board", DutyOnBoardRoutes);

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Hotel Orion International Server Running...",
  });
});

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong",
    stack: err.stack,
  });
});

// 404
app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;