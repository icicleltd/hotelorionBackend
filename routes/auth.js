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

// for update user permission
router.patch(
  "/update-user-permission/:id",
  AuthController.updateUserPermission
);

module.exports = router;
