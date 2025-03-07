const express = require("express");
const { getRooms, createRooms, getRoomsByDateRange } = require("../controllers/roomsControllers");

const router = express.Router();

router.post("/add-rooms", createRooms);
router.get("/allrooms", getRooms);
router.get("/getroombydate", getRoomsByDateRange);

module.exports = router;
