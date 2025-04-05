// const CardPaymentItemModel = require("../models/CardPaymentItemModel");

const CardPaymentItemModel = require("./cardPaymentItem.model");

exports.createCardPaymentItem = async (req, res) => {
    try {
      const { cardPaymentItemName } = req.body;
      
      // Validate request
      if (!cardPaymentItemName) {
        return res.status(400).json({
          success: false,
          message: "Card payment item name is required"
        });
      }
  
      // Create new extra payment item
      const newCardPaymentItem = new CardPaymentItemModel({
        cardPaymentItemName
      });
  
      // Save to database
      const savedItem = await newCardPaymentItem.save();
  
      return res.status(201).json({
        success: true,
        message: "Card  payment item created successfully",
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

exports.getAllCardPaymentItems = async (req, res) => {
  try {
    const cardPaymentItems = await CardPaymentItemModel.find({}).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: cardPaymentItems.length,
      data: cardPaymentItems
    });
  } catch (error) {
    console.error("Error fetching card payment items:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch card payment items",
      error: error.message
    });
  }
};

// exports.getCardPaymentItemById = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const cardPaymentItem = await CardPaymentItemModel.findById(id);
    
//     if (!cardPaymentItem) {
//       return res.status(404).json({
//         success: false,
//         message: "Card payment item not found"
//       });
//     }
    
//     return res.status(200).json({
//       success: true,
//       data: cardPaymentItem
//     });
//   } catch (error) {
//     console.error("Error fetching card payment item:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch card payment item",
//       error: error.message
//     });
//   }
// };

// exports.updateCardPaymentItem = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { cardPaymentItemName } = req.body;
    
//     // Validate request
//     if (!cardPaymentItemName) {
//       return res.status(400).json({
//         success: false,
//         message: "Card payment item name is required"
//       });
//     }
    
//     const updatedItem = await CardPaymentItemModel.findByIdAndUpdate(
//       id,
//       { cardPaymentItemName },
//       { new: true, runValidators: true }
//     );
    
//     if (!updatedItem) {
//       return res.status(404).json({
//         success: false,
//         message: "Card payment item not found"
//       });
//     }
    
//     return res.status(200).json({
//       success: true,
//       message: "Card payment item updated successfully",
//       data: updatedItem
//     });
//   } catch (error) {
//     console.error("Error updating card payment item:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update card payment item",
//       error: error.message
//     });
//   }
// };

// exports.deleteCardPaymentItem = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const deletedItem = await CardPaymentItemModel.findByIdAndDelete(id);
    
//     if (!deletedItem) {
//       return res.status(404).json({
//         success: false,
//         message: "Card payment item not found"
//       });
//     }
    
//     return res.status(200).json({
//       success: true,
//       message: "Card payment item deleted successfully"
//     });
//   } catch (error) {
//     console.error("Error deleting card payment item:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete card payment item",
//       error: error.message
//     });
//   }
// };