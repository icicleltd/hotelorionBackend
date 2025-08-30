// const DutyOnBoardModel = require("../models/DutyOnBoardModel");

const DutyOnBoardModel = require("./dutyOnBoard.model");

// Helper function to generate all dates between start and end
function getDatesInRange(startDateStr, endDateStr) {
  const [startDay, startMonth, startYear] = startDateStr.split("-").map(Number);
  const [endDay, endMonth, endYear] = endDateStr.split("-").map(Number);

  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  const date = new Date(start.getTime());
  const dates = [];

  while (date <= end) {
    const formattedDate = date.toLocaleDateString("en-GB");
    dates.push(formattedDate.replace(/\//g, "-"));
    date.setDate(date.getDate() + 1);
  }

  return dates;
}

const createADutyOnBoard = async (req, res) => {
  try {
    const { dateRange, timeRange, shift, housekeeper, frontdesk } = req.body;

    // 1. Validate essential fields
    if (!dateRange || !timeRange || !shift) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: dateRange, timeRange, and shift are mandatory.",
      });
    }

    // 2. Check if at least one department has staff assigned
    if ((!housekeeper || housekeeper.length === 0) && (!frontdesk || frontdesk.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Must provide staff for at least one department (housekeeper or frontdesk).",
      });
    }

    // 3. Split the date range into start and end
    const [startDateStr, endDateStr] = dateRange.split(" - ");

    if (!startDateStr || !endDateStr) {
      return res.status(400).json({
        success: false,
        message: "Invalid dateRange format. Please use 'DD-MM-YYYY - DD-MM-YYYY'.",
      });
    }

    // 4. Generate an array of all individual dates in the range
    const allDates = getDatesInRange(startDateStr, endDateStr);

    // 5. Find the existing roster document
    let existingRoster = await DutyOnBoardModel.findOne({});

    if (!existingRoster) {
      existingRoster = new DutyOnBoardModel({
        dateRange: dateRange,
        dutyOnHousekeeper: [],
        dutyOnFrontdesk: [],
      });
    } else {
      existingRoster.dateRange = dateRange;
    }

    // 6. Process each date and update existing entries or create new ones
    for (const date of allDates) {
      // Check if this date already exists in either array
      const existingHousekeepingEntry = existingRoster.dutyOnHousekeeper.find(
        (entry) => entry.date === date && entry.timeRange === timeRange && entry.shift === shift
      );

      const existingFrontdeskEntry = existingRoster.dutyOnFrontdesk.find(
        (entry) => entry.date === date && entry.timeRange === timeRange && entry.shift === shift
      );

      // If an entry exists in housekeeping, update it
      if (existingHousekeepingEntry) {
        if (housekeeper && housekeeper.length > 0) {
          existingHousekeepingEntry.housekeeper = housekeeper;
        }
        if (frontdesk && frontdesk.length > 0) {
          existingHousekeepingEntry.frontdesk = frontdesk;
        }
      }
      // If an entry exists in frontdesk, update it
      else if (existingFrontdeskEntry) {
        if (housekeeper && housekeeper.length > 0) {
          existingFrontdeskEntry.housekeeper = housekeeper;
        }
        if (frontdesk && frontdesk.length > 0) {
          existingFrontdeskEntry.frontdesk = frontdesk;
        }
      }
      // If no entry exists for this date, create new entries
      else {
        // Create housekeeping assignment if requested
        if (housekeeper && housekeeper.length > 0) {
          existingRoster.dutyOnHousekeeper.push({
            date: date,
            timeRange: timeRange,
            shift: shift,
            housekeeper: housekeeper,
            frontdesk: frontdesk && frontdesk.length > 0 ? frontdesk : [],
          });
        }

        // Create frontdesk assignment if requested (REMOVED THE WRONG CONDITION)
        if (frontdesk && frontdesk.length > 0) {
          existingRoster.dutyOnFrontdesk.push({
            date: date,
            timeRange: timeRange,
            shift: shift,
            frontdesk: frontdesk,
            housekeeper: housekeeper && housekeeper.length > 0 ? housekeeper : [],
          });
        }
      }
    }

    // 7. Save the updated roster
    const updatedRoster = await existingRoster.save();

    // 8. Populate the results for the response
    const populatedRoster = await DutyOnBoardModel.findById(updatedRoster._id).populate(
      "dutyOnHousekeeper.housekeeper dutyOnHousekeeper.frontdesk dutyOnFrontdesk.frontdesk dutyOnFrontdesk.housekeeper"
    );

    // 9. Send success response
    res.status(201).json({
      success: true,
      message: `Duty roster successfully processed for ${allDates.length} days.`,
      data: populatedRoster,
    });
  } catch (error) {
    console.error("Error creating duty on board:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error. Could not create roster.",
      error: error.message,
    });
  }
};

const DutyOnBoardController = {
  createADutyOnBoard,
};

module.exports = DutyOnBoardController;
// utils/dateUtils.js (Optional: create a separate file for this)
// Helper function to generate all dates between start and end
function getDatesInRange(startDateStr, endDateStr) {
  // Parse the dates. Assuming format "DD-MM-YYYY"
  const [startDay, startMonth, startYear] = startDateStr.split("-").map(Number);
  const [endDay, endMonth, endYear] = endDateStr.split("-").map(Number);

  // Note: Month is 0-indexed in JavaScript Date (0 = January, 11 = December)
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  const date = new Date(start.getTime());
  const dates = [];

  // Loop through each day from start to end
  while (date <= end) {
    // Format the date back to "DD-MM-YYYY"
    const formattedDate = date.toLocaleDateString("en-GB"); // gives DD/MM/YYYY
    dates.push(formattedDate.replace(/\//g, "-")); // replaces '/' with '-' to get DD-MM-YYYY
    date.setDate(date.getDate() + 1); // Move to the next day
  }

  return dates;
}
