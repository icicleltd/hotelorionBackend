const Customers = require("../models/CustomersModel");

exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await Customers.find();
    res.status(200).json({
      message: "All Customers get successfully",
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const id = req.params.id;
    const deleteCustomer = await Customers.findByIdAndDelete(id);
    if (!deleteCustomer) {
      return res.status(404).json({ message: "Customers not Delete" });
    }
    res.status(200).json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
