const ComplaintRoomModel = require("../models/complaintRoomModel");

// create a new complaint for a room
exports.createComplaint = async (req, res, next) => {
  try {
    const { complaintRooms, complaints } = req.body;

    if (
      !complaintRooms ||
      !Array.isArray(complaintRooms) ||
      complaintRooms.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Complaint rooms are required and must be an array",
      });
    }

    if (!complaints || !Array.isArray(complaints) || complaints.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Complaints are required and must be an array",
      });
    }

    // Create a new complaint document
    const newComplaint = new ComplaintRoomModel({
      complaintRooms,
      complaints,
      isComplaints: true,
    });

    // Save the complaint document to the database
    await newComplaint.save();

    res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      data: newComplaint,
    });
  } catch (error) {
    console.error("Error creating complaint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create complaint",
      error: error.message,
    });
  }
};

// Get complaints for a specific room
exports.getComplaintByRoom = async (req, res, next) => {
  try {
    const roomName = req.params.roomName;

    if (!roomName) {
      return res.status(400).json({
        success: false,
        message: "Room name is required",
      });
    }

    // Find complaints for the given room
    const complaints = await ComplaintRoomModel.find({
      complaintRooms: { $in: [roomName] },
      isComplaints: true,
    });

    if (!complaints || complaints.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No complaints found for room ${roomName}`,
      });
    }

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error("Error fetching complaints for room:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch complaints for room",
      error: error.message,
    });
  }
};

exports.deleteComplaintByRoom = async (req, res, next) => {
  try {
    const roomName = req.params.roomName;

    if (!roomName) {
      return res.status(400).json({
        success: false,
        message: "Room name is required",
      });
    }

    // Find and delete complaints for the given room
    const result = await ComplaintRoomModel.findOneAndUpdate(
      { complaintRooms: { $in: [roomName] }, isComplaints: true },
      {
        $set: { isComplaints: false },
        $pull: { complaintRooms: roomName },
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: `No complaints found for room ${roomName}`,
      });
    }

    // If complaintRooms is empty, remove the document
    if (result.complaintRooms.length === 0) {
      await ComplaintRoomModel.findByIdAndDelete(result._id);
    }

    res.status(200).json({
      success: true,
      message: `Complaints for room ${roomName} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting complaints for room:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete complaints for room",
      error: error.message,
    });
  }
};
