const HousekeeperNameModel = require("./housekeeperName.model");

exports.createHousekeeperName = async (req, res) => {
  try {
    const { name, idNumber } = req.body;
    // Validate input
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Create a new housekeeper name entry
    const newHousekeeperName = new HousekeeperNameModel({
      name,
      idNumber,
    });

    // Save the entry to the database
    await newHousekeeperName.save();

    // Respond with the created entry
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "Housekeeper name created successfully",
      housekeeperName: newHousekeeperName,
    });
  } catch (error) {
    console.error("Error creating housekeeper name:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getHousekeeperName = async (req, res) => {
  try {
    const housekeeperNames = await HousekeeperNameModel.find();
    if (housekeeperNames.length === 0) {
      return res.status(404).json({ message: "No housekeeper names found" });
    }
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Housekeeper names fetched successfully",
      data: housekeeperNames,
    });
  } catch (error) {
    console.error("Error fetching housekeeper names:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
