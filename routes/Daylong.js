const express = require("express");
const {
  createDaylongCustomers,
  getdaylongCustomers,
  updatedaylongAddons,
} = require("../controllers/DaylogControllers");
const router = express.Router();

router.get("/getdaylong", getdaylongCustomers);
router.post("/createdaylong", createDaylongCustomers);
router.put("/updateedaylongaddons/:id", updatedaylongAddons);

module.exports = router;
