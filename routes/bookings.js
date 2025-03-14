const express = require("express");
const {
  createbookings,
  getbookings,
  updatebooking,
  deletebooking,
  getSingleBookings,
  getbookingsbydate,
  updateduepayment,
  getroomsbyname,
  getbookingsbyroomname,
  getbookingsbyroomNumber,
  updatenightstayaddons,
  updatedBookingInfo,
  getLastbookingsId,
  roomsColorStatus,
} = require("../controllers/bookingsControllers");
const router = express.Router();

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;


//========== for file upload to cloudinary  start here
cloudinary.config({
  cloud_name: "dc4vc3r5r", // Add these to your .env file
  api_key: "362167577134478",
  api_secret: "piIbepD48vX9OpXpQGqFp_RrSTg"
});
 
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hotel-bookings', // The folder in Cloudinary where images will be stored
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'], // Allowed file formats
    transformation: [{ width: 500, height: 500, crop: 'limit' }] // Optional transformations
  }
});

const upload = multer({ storage: storage });
//========= for file upload to cloudinary  end here

// router.post("/add-bookings", createbookings);
router.post('/add-bookings', upload.single('nidFile'), createbookings);
router.get("/allbookings", getbookings);
router.get("/allbookings/:id", getSingleBookings);
router.get("/datebookings", getbookingsbydate);
router.get("/roombookings", getbookingsbyroomname);
router.get("/roomname", getroomsbyname);
router.get("/roomnumber", getbookingsbyroomNumber);
router.put("/updatebooking/:id", updatebooking); // for checkout
router.put("/updateduepayment", updateduepayment); // for payment
router.put("/updateaddons", updatenightstayaddons); // for addons
router.delete("/deletebooking/:id", deletebooking);

router.patch("/allbookings/:id", updatedBookingInfo);

router.get("/lastRegisteredId", getLastbookingsId)

router.get("/color-status/:date", roomsColorStatus)

module.exports = router;
