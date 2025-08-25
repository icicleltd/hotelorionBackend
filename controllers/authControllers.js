const User = require("../models/UserModel");
const bcrypt = require("bcryptjs");
const { createError } = require("../utils/error");
const jwt = require("jsonwebtoken");

exports.register = async (req, res, next) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
      username: req.body.username,
      staffId: req.body.staffId,
      phone: req.body.phone,
      email: req.body.email,
      password: hashedPassword,
      role: req.body.role,
      permission: req.body.permission,
      payAggrement: req.body.payAggrement,
    });
    const user = await newUser.save();
    res.status(200).json({
      message: "user added successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return next(createError(400, "Email Not Found"));

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) return next(createError(400, "Password is wrong"));

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    const { password, ...others } = user._doc;
    res.status(200).json({ ...others, token });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getAllUser = async (req, res, next) => {
  try {
    const result = await User.find();
    res.status(200).json({
      success: true,
      message: "All Users Retrieve successfully !!",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "All Users Retrieve Failed !!",
    });
  }
};

// update user permission
const updateUserPermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    // console.log("Received permissions:", permissions);

    // Validate permissions is an array
    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "Permissions must be an array",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Replace existing permissions with new ones (not merge)
    user.permission = permissions;
    user.updatedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "User permissions updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating user permissions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user permissions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports.AuthController = {
  getAllUser,
  updateUserPermission,
};
