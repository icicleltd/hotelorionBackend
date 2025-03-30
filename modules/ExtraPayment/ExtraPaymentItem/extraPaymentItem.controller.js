const ExtraPaymentItemModel = require("./extraPaymentItem.model");

// Create a new extra payment item
exports.createExtraPaymentItem = async (req, res) => {
  try {
    const { extraPaymentItemName } = req.body;
    
    // Validate request
    if (!extraPaymentItemName) {
      return res.status(400).json({
        success: false,
        message: "Extra payment item name is required"
      });
    }

    // Create new extra payment item
    const newExtraPaymentItem = new ExtraPaymentItemModel({
      extraPaymentItemName
    });

    // Save to database
    const savedItem = await newExtraPaymentItem.save();

    return res.status(201).json({
      success: true,
      message: "Extra payment item created successfully",
      data: savedItem
    });
  } catch (error) {
    console.error("Error creating extra payment item:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create extra payment item",
      error: error.message
    });
  }
};

// Get all extra payment items
exports.getAllExtraPaymentItems = async (req, res) => {
  try {
    const extraPaymentItems = await ExtraPaymentItemModel.find().sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      message: "Extra payment items retrieved successfully",
      count: extraPaymentItems.length,
      data: extraPaymentItems
    });
  } catch (error) {
    console.error("Error getting extra payment items:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve extra payment items",
      error: error.message
    });
  }
};

// Get a specific extra payment item by ID
exports.getExtraPaymentItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const extraPaymentItem = await ExtraPaymentItemModel.findById(id);
    
    if (!extraPaymentItem) {
      return res.status(404).json({
        success: false,
        message: "Extra payment item not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Extra payment item retrieved successfully",
      data: extraPaymentItem
    });
  } catch (error) {
    console.error("Error getting extra payment item:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve extra payment item",
      error: error.message
    });
  }
};

// Update an extra payment item
exports.updateExtraPaymentItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { extraPaymentItemName } = req.body;
    
    // Validate request
    if (!extraPaymentItemName) {
      return res.status(400).json({
        success: false,
        message: "Extra payment item name is required"
      });
    }
    
    const updatedExtraPaymentItem = await ExtraPaymentItemModel.findByIdAndUpdate(
      id,
      { extraPaymentItemName },
      { new: true, runValidators: true }
    );
    
    if (!updatedExtraPaymentItem) {
      return res.status(404).json({
        success: false,
        message: "Extra payment item not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Extra payment item updated successfully",
      data: updatedExtraPaymentItem
    });
  } catch (error) {
    console.error("Error updating extra payment item:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update extra payment item",
      error: error.message
    });
  }
};

// Delete an extra payment item
exports.deleteExtraPaymentItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedExtraPaymentItem = await ExtraPaymentItemModel.findByIdAndDelete(id);
    
    if (!deletedExtraPaymentItem) {
      return res.status(404).json({
        success: false,
        message: "Extra payment item not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Extra payment item deleted successfully",
      data: deletedExtraPaymentItem
    });
  } catch (error) {
    console.error("Error deleting extra payment item:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete extra payment item",
      error: error.message
    });
  }
};