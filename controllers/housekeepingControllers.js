// const ComplaintRoomModel = require("../models/complaintRoomModel");
const ComplaintRoomModel = require("../models/complaintRoomModel");
const HouseKeepingModel = require("../models/housekeepingModel");


exports.createHousekeeping = async (req, res, next) => {
  try {
    // console.log(req.body);

    if (!req.body.roomName) {
      console.log("roomName is missing in the request body");
      return res.status(400).json({
        message: "roomName is required",
      });
    }

    // Create an explicit object with all the required fields
    const housekeepingData = {
      roomName: [req.body.roomName],
      housekeeperName: req.body.housekeeperName || "",
      workingItem: req.body.workingItem || [],
      isCleaning: req.body.isCleaning || false,
    };

    // Create the new housekeeping record
    const newHousekeeping = await HouseKeepingModel.create(housekeepingData);
    
    // Check if isComplaints is true, then save to complaint database
    if (req.body.isComplaints === true) {
      const complaintData = {
        complaintRooms: req.body.complaintRooms || [req.body.roomName], // Use provided rooms or default to current room
        complaints: req.body.complaints || [],
        isComplaints: true
      };
      
      // Save to complaint database
      const newComplaint = await ComplaintRoomModel.create(complaintData);
      
      // Return both records
      return res.status(200).json({
        message: "Housekeeping record and complaint added successfully",
        data: {
          housekeeping: newHousekeeping,
          complaint: newComplaint
        },
      });
    }
    
    // Return just the housekeeping record if no complaints
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
// Update a housekeeping item
exports.updateHousekeeping = async (req, res) => {
  try {
    const roomName = req.params.roomName;
    const requestData = req.body;

    // Find the housekeeping record for this room (we'll delete it after potential complaint processing)
    const housekeepingRecord = await HouseKeepingModel.findOne(
      { roomName: roomName },
      {},
      {
        sort: { createdAt: -1 } // Get the most recent record for this room
      }
    );

    if (!housekeepingRecord) {
      return res.status(404).json({
        success: false,
        message: `Housekeeping item for room ${roomName} not found`,
      });
    }

    // Check if isComplaints is true, then save to complaint database before deletion
    if (requestData.isComplaints === true) {
      const complaintData = {
        complaintRooms: requestData.complaintRooms || [roomName], // Use provided rooms or default to current room
        complaints: requestData.complaints || [],
        isComplaints: true
      };
      
      // Save to complaint database
      const newComplaint = await ComplaintRoomModel.create(complaintData);
      
      // Now delete the housekeeping record
      await HouseKeepingModel.findByIdAndDelete(housekeepingRecord._id);
      
      // Return both the deletion confirmation and new complaint
      return res.status(200).json({
        success: true,
        message: "Housekeeping record deleted and complaint added successfully",
        data: {
          deletedHousekeeping: housekeepingRecord,
          complaint: newComplaint
        },
      });
    }

    // If no complaint, just delete the housekeeping record
    await HouseKeepingModel.findByIdAndDelete(housekeepingRecord._id);

    // Return just the housekeeping deletion confirmation
    res.status(200).json({
      success: true,
      message: `Housekeeping for room ${roomName} deleted successfully`,
      data: housekeepingRecord,
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
