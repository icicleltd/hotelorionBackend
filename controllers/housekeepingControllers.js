const HouseKeepingModel = require("../models/housekeepingModel");

exports.createHousekeeping = async (req, res, next) => {
  try {
    if (!req.body.roomName) {
      console.log("roomName is missing in the request body");
      return res.status(400).json({
        message: "roomName is required",
      });
    }

    // Create an explicit object with all the required fields
    const housekeepingData = {
      roomName: req.body.roomName,
      housekeeperName: req.body.housekeeperName || "",
      workingItem: req.body.workingItem || [], // Added workingItem field
      isCleaning: req.body.isCleaning || false,
    };

    // console.log(
    //   "Prepared data for database:",
    //   JSON.stringify(housekeepingData, null, 2)
    // );

    // Create the new housekeeping record
    const newHousekeeping = await HouseKeepingModel.create(housekeepingData);
    // console.log(
    //   "Created housekeeping record:",
    //   JSON.stringify(newHousekeeping, null, 2)
    // );

    // Return the created record
    res.status(200).json({
      message: "Housekeeping record added successfully",
      data: newHousekeeping,
    });
  } catch (error) {
    console.error("Error creating housekeeping record:", error);
    // Check for specific validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Validation Error",
        errors: errors,
      });
    }
    next(error);
  }
};

// Get all housekeeping items
exports.getAllHousekeeping = async (req, res) => {
  try {
    const housekeepingItems = await HouseKeepingModel.find();

    res.status(200).json({
      success: true,
      count: housekeepingItems.length,
      data: housekeepingItems,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch housekeeping items",
      error: error.message,
    });
  }
};

// Get a specific housekeeping item by ID
exports.getHousekeepingById = async (req, res) => {
  try {
    const id = req.params.id;
    const housekeepingItem = await HouseKeepingModel.findById(id);

    if (!housekeepingItem) {
      return res.status(404).json({
        success: false,
        message: "Housekeeping item not found",
      });
    }

    res.status(200).json({
      success: true,
      data: housekeepingItem,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch housekeeping item",
      error: error.message,
    });
  }
};

// Update a housekeeping item
exports.updateHousekeeping = async (req, res) => {
    try {
      const roomName = req.params.roomName; // Changed from id to roomName
      const updateData = req.body;

    //   console.log(roomName)
  
      // Find the most recent housekeeping record for this room and update it
      const updatedHousekeeping = await HouseKeepingModel.findOneAndUpdate(
        { roomName: roomName }, // Search by roomName instead of _id
        updateData,
        { 
          new: true, 
          runValidators: true,
          sort: { createdAt: -1 } // Get the most recent record for this room
        }
      );
  
      if (!updatedHousekeeping) {
        return res.status(404).json({
          success: false,
          message: `Housekeeping item for room ${roomName} not found`,
        });
      }
  
      res.status(200).json({
        success: true,
        message: `Housekeeping for room ${roomName} updated successfully`,
        data: updatedHousekeeping,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Failed to update housekeeping item",
        error: error.message,
      });
    }
  };

// Delete a housekeeping item
exports.deleteHousekeeping = async (req, res) => {
  try {
    const id = req.params.id;
    const deletedHousekeeping = await HouseKeepingModel.findByIdAndDelete(id);

    if (!deletedHousekeeping) {
      return res.status(404).json({
        success: false,
        message: "Housekeeping item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Housekeeping item deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete housekeeping item",
      error: error.message,
    });
  }
};
