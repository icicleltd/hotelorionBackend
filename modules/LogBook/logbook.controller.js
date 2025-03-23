const logBookModel = require("./logbook.model");

exports.createLogBook = async (req, res, next) => {
  try {
    // console.log("LogBook Controller");
    // console.log(req.body);
    const result = await logBookModel.create(req.body);
    // console.log(result);
    res.status(200).json({
      success: true,
      message: "LogBook Created",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
exports.getLogBooks = async (req, res, next) => {
  try {
    // console.log("LogBook Controller");
    // console.log(req.body);
    const result = await logBookModel.find().sort({ createdAt: -1 });
    // console.log(result);
    res.status(200).json({
      success: true,
      message: "All LogBooks Retrieved Successfully",
      status: 200,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteLogBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await logBookModel.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "LogBook Deleted",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateLogBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await logBookModel.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({
      success: true,
      message: "LogBook Updated",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
