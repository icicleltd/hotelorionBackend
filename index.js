const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();
const auth = require("./routes/auth");
const rooms = require("./routes/rooms");
const bookings = require("./routes/bookings");
const customers = require("./routes/customers");
const reports = require("./routes/reports");
const onlinebooking = require("./routes/onlineBooking");
const contacts = require("./routes/contacts");
const daylong = require("./routes/Daylong");
const corporate = require("./routes/corporateBookings");
const { connectDb } = require("./utils/dbConnect");
const bookingGuestRoute = require("./modules/BookingGuest/bookingGuest.routes");
const housekeepingRouter = require("./routes/housekeeping");

//middleWire
app.use(cors());
app.use(express.json());

//MongoDb connection
connectDb();

//Routes
app.use("/api/auth", auth);
app.use("/api/rooms", rooms);
app.use("/api/bookings", bookings);
app.use("/api/onlinebooking", onlinebooking);
app.use("/api/customers", customers);

// report
app.use("/api/reports", reports);

// housekeeping
app.use("/api/housekeeping", housekeepingRouter);

app.use("/api/contacts", contacts);
app.use("/api/daylong", daylong);
app.use("/api/corporate", corporate);

// updated
app.use("/api/booking-guest", bookingGuestRoute);

app.get("/", async (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Hotel Orion International Server Running...",
  });
});

app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMassage = err.message || "Something went wrong";
  res.status(errorStatus).json({
    success: "Failed",
    status: errorStatus,
    message: errorMassage,
    stack: err.stack,
  });
});

// //All
app.all("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(port, () =>
  console.log(`Hotel Orion International Server Running on ${port}`)
);
