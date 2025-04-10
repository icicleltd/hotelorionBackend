const Bookings = require("../../models/bookingsModel");
const ExtraPaymentModel = require("./extraPayment.model");
// const Bookings = require("../path/to/your/booking.model"); // Update with correct path
const mongoose = require("mongoose");

// Create a new extra payment and update the related booking
exports.createExtraPayment = async (req, res, next) => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { booking_id, ...paymentData } = req.body;

    // Validate booking_id
    if (!mongoose.Types.ObjectId.isValid(booking_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID format",
      });
    }

    // Check if booking exists
    const booking = await Bookings.findById(booking_id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Create the extra payment
    const extraPayment = await ExtraPaymentModel.create([req.body], { session });
    
    // Add payment to booking's addons array
    const addonItem = {
      itemName: paymentData.extraServiceName,
      item: paymentData.extraServiceRoomNumber,
      itemPrice: paymentData.extraServicePrice,
      itemDate: paymentData.extraServiceDate,
      total: paymentData.extraServiceTotal
    };
    
    // Calculate the new due amount by adding the extra service total to the current due amount
    const newDueAmount = booking.dueAmount + Number(paymentData.extraServicePrice);
    // console.log(newDueAmount, "newDueAmount");
    // Update booking document
    const response = await Bookings.findByIdAndUpdate(
      booking_id,
      { 
        $push: { addons: addonItem },
        $set: { 
          extraPayment: extraPayment[0]._id,
          dueAmount: newDueAmount,
          // Update the beforeDiscountCost as well to maintain consistency
          beforeDiscountCost: booking.beforeDiscountCost + Number(paymentData.extraServiceTotal)
        }
      },
      { session }
    );

    console.log(response, "response")

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Extra Payment Created and Booking Updated",
      data: extraPayment[0],
    });
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// Get all extra payments
exports.getAllExtraPayments = async (req, res, next) => {
  try {
    const result = await ExtraPaymentModel.find()
      .populate('booking_id')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      message: "Extra Payments Retrieved",
      count: result.length,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get extra payments by booking ID
exports.getExtraPaymentsByBookingId = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID format",
      });
    }
    
    const result = await ExtraPaymentModel.find({ booking_id: bookingId })
      .populate('booking_id')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      message: "Extra Payments for Booking Retrieved",
      count: result.length,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single extra payment by ID
exports.getExtraPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid extra payment ID format",
      });
    }
    
    const result = await ExtraPaymentModel.findById(id)
      .populate('booking_id');
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Extra Payment not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Extra Payment Retrieved",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Update an extra payment
exports.updateExtraPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { booking_id, ...paymentData } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid extra payment ID format",
      });
    }

    // Get the original payment first
    const originalPayment = await ExtraPaymentModel.findById(id);
    if (!originalPayment) {
      return res.status(404).json({
        success: false,
        message: "Extra Payment not found",
      });
    }
    
    // Update the extra payment
    const result = await ExtraPaymentModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true, session }
    );
    
    // If there's a change in data that should be reflected in booking addons
    if (originalPayment.extraServiceName !== paymentData.extraServiceName ||
        originalPayment.extraServiceRoomNumber !== paymentData.extraServiceRoomNumber ||
        originalPayment.extraServicePrice !== paymentData.extraServicePrice ||
        originalPayment.extraServiceTotal !== paymentData.extraServiceTotal) {
      
      // Create updated addon item
      const updatedAddonItem = {
        itemName: paymentData.extraServiceName || originalPayment.extraServiceName,
        item: paymentData.extraServiceRoomNumber || originalPayment.extraServiceRoomNumber,
        itemPrice: paymentData.extraServicePrice || originalPayment.extraServicePrice,
        total: paymentData.extraServiceTotal || originalPayment.extraServiceTotal
      };
      
      // Find the booking and the specific addon to update
      const bookingId = booking_id || originalPayment.booking_id;
      const booking = await Bookings.findById(bookingId);
      
      if (booking && booking.addons && booking.addons.length > 0) {
        // Find the matching addon (this is approximate matching)
        const addonIndex = booking.addons.findIndex(addon => 
          addon.itemName === originalPayment.extraServiceName &&
          addon.item === originalPayment.extraServiceRoomNumber
        );
        
        if (addonIndex !== -1) {
          // Update the specific addon in the array
          booking.addons[addonIndex] = updatedAddonItem;
          await booking.save({ session });
        }
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: "Extra Payment Updated",
      data: result,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// Delete an extra payment
exports.deleteExtraPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid extra payment ID format",
      });
    }
    
    // Get the payment before deleting to get associated booking
    const payment = await ExtraPaymentModel.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Extra Payment not found",
      });
    }
    
    // Delete the extra payment
    const result = await ExtraPaymentModel.findByIdAndDelete(id, { session });
    
    // Remove from booking's addons array
    await Bookings.findByIdAndUpdate(
      payment.booking_id,
      { 
        $pull: { 
          addons: { 
            itemName: payment.extraServiceName,
            item: payment.extraServiceRoomNumber 
          } 
        },
        $unset: { extraPayment: "" }
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: "Extra Payment Deleted and Booking Updated",
      data: result,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// Get summary statistics for extra payments
exports.getExtraPaymentStats = async (req, res, next) => {
  try {
    const stats = await ExtraPaymentModel.aggregate([
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          totalAmount: { $sum: "$extraServiceTotal" },
          avgAmount: { $avg: "$extraServiceTotal" },
          minAmount: { $min: "$extraServiceTotal" },
          maxAmount: { $max: "$extraServiceTotal" }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      message: "Extra Payment Statistics Retrieved",
      data: stats.length > 0 ? stats[0] : {
        totalCount: 0,
        totalAmount: 0,
        avgAmount: 0,
        minAmount: 0,
        maxAmount: 0
      },
    });
  } catch (error) {
    next(error);
  }
};