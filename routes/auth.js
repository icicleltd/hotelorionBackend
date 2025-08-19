const express = require("express");
const {
  register,
  login,
  AuthController,
} = require("../controllers/authControllers");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/get-all-users", AuthController.getAllUser);

module.exports = router;
