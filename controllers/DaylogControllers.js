const Daylong = require("../models/DaylongModel");

exports.createDaylongCustomers = async (req, res, next) => {
  try {
    const customers = Daylong.create(req.body);
    res.status(200).json({
      message: "Daylong Customer deleted successfully",
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

exports.getdaylongCustomers = async (req, res, next) => {
  try {
    const DaylongCustomers = await Daylong.find();

    res.status(200).json({
      message: "DaylongCustomers get successfully",
      data: DaylongCustomers,
    });
  } catch (error) {
    next(error);
  }
};

exports.updatedaylongAddons = async (req, res, next) => {
  try {
    const id = req.params.id;
    const addonsName = req.body.addonsName;
    const addonsPrices = req.body.addonsPrices;
    const totalPrice =
      addonsPrices.reduce((sum, item) => sum + Number(item.total), 0) + req.body.roomsCost;
    const existingDaylong = await Daylong.findById(id);

    const updatedAddonsName = existingDaylong.addonsName.concat(addonsName);
    const updatedAddonsPrices = existingDaylong.addonsPrices.concat(addonsPrices);

    const newPaidAmount = existingDaylong.paidAmount;
    const newDueAmount = existingDaylong.dueAmount + totalPrice;
    const updateAddons = await Daylong.findByIdAndUpdate(
      id,
      {
        addonsName: updatedAddonsName,
        addonsPrices: updatedAddonsPrices,
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        roomType: req.body.roomType,
        roomsNumber: req.body.roomsNumber,
        discountPercentageroom: req.body.discountPercentageroom,
        discountFlatroom: req.body.discountFlatroom,
        beforeRoomCost: req.body.beforeRoomCost,
        roomsCost: req.body.roomsCost,
      },
      { new: true }
    );
    res.status(200).json({
      message: "Addons Update successfully",
      data: updateAddons,
    });
  } catch (error) {
    next(error);
  }
};
