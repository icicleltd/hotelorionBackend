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

// for update user password
router.patch("/update-user-password/:id", AuthController.updateUserPassword);

// for update user information
router.patch("/update-user-info/:id", AuthController.updateUserInfo);

// for delete user
router.delete("/delete-user/:id", AuthController.deleteUser);

module.exports = router;
