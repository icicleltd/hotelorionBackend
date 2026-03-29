const express = require("express");
const cors = require("cors");
const { connectDB } = require("./utils/dbConnect");

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

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── DB Connection Middleware (runs before every request) ─────────────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("🔴 [DB] Connection failed on request:", req.method, req.path);
    console.error("🔴 [DB] Error:", error.message);
    return res.status(503).json({
      success: false,
      status: 503,
      message: "Database unavailable. Please try again shortly.",
    });
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
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

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Hotel Orion International Server Running...",
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("🔴 [ERROR]", err.message);
  res.status(err.status || 500).json({
    success: false,
    status: err.status || 500,
    message: err.message || "Something went wrong",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;