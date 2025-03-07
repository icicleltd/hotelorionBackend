const express = require("express");
// const {
//   createbookings,
//   getbookings,
// } = require("../controllers/bookingsControllers");
const router = express.Router();

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { createBookingGuest } = require("./bookingGuest.controller");
const cloudinary = require("cloudinary").v2;

//========== for file upload to cloudinary  start here
cloudinary.config({
  cloud_name: "dc4vc3r5r", // Add these to your .env file
  api_key: "362167577134478",
  api_secret: "piIbepD48vX9OpXpQGqFp_RrSTg",
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hotel-bookings", // The folder in Cloudinary where images will be stored
    allowed_formats: ["jpg", "png", "jpeg", "pdf"], // Allowed file formats
    transformation: [{ width: 500, height: 500, crop: "limit" }], // Optional transformations
  },
});
const upload = multer({ storage: storage });
//========= for file upload to cloudinary  end here

// router.post("/add-bookings", createbookings);
router.post("/add-booking-guest", upload.single("nidFile"), createBookingGuest);
// router.get("/allbookings", getbookings);

const bookingGuestRoute = router;
module.exports = bookingGuestRoute;

// module.exports = router;
