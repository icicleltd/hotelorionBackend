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
    const { dateRange, timeRange, shift, housekeeper, department } = req.body;

    // 1. Validate essential fields
    if (!dateRange || !timeRange || !shift || !department) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: dateRange, timeRange, shift, and department are mandatory.",
      });
    }

    // 2. Check if staff is assigned based on department
    if (!housekeeper || housekeeper.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Must provide staff members for the selected department.",
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

    // 5. Check if a roster with the same date range exists
    let existingRoster = await DutyOnBoardModel.findOne({ dateRange: dateRange });

    if (!existingRoster) {
      // Create new document if date range doesn't match
      existingRoster = new DutyOnBoardModel({
        dateRange: dateRange,
        dutyOnHousekeeper: [],
        dutyOnFrontdesk: [],
      });
      console.log(`Created new roster document for date range: ${dateRange}`);
    } else {
      console.log(`Found existing roster document for date range: ${dateRange}`);
    }

    // 6. Process each date based on department
    for (const date of allDates) {
      
      if (department === 'housekeeper') {
        // Process HOUSEKEEPER assignments
        const existingHousekeepingEntry = existingRoster.dutyOnHousekeeper.find(
          (entry) => entry.date === date && entry.timeRange === timeRange && entry.shift === shift
        );

        if (existingHousekeepingEntry) {
          // Update existing housekeeping entry
          existingHousekeepingEntry.housekeeper = housekeeper;
          console.log(`Updated existing housekeeper entry for ${date}`);
        } else {
          // Create new housekeeping entry - ONLY with housekeeper data, no frontdesk field
          const newEntry = {
            date: date,
            timeRange: timeRange,
            shift: shift,
            housekeeper: housekeeper
          };
          existingRoster.dutyOnHousekeeper.push(newEntry);
          console.log(`Created new housekeeper entry for ${date}`);
        }
      } 
      else if (department === 'frontend') {
        // Process FRONTEND assignments (treating as frontdesk in your model)
        const existingFrontendEntry = existingRoster.dutyOnFrontdesk.find(
          (entry) => entry.date === date && entry.timeRange === timeRange && entry.shift === shift
        );

        if (existingFrontendEntry) {
          // Update existing frontend entry
          existingFrontendEntry.frontdesk = housekeeper; // Using housekeeper array for frontend staff
          console.log(`Updated existing frontend entry for ${date}`);
        } else {
          // Create new frontend entry - ONLY with frontdesk data, no housekeeper field
          const newEntry = {
            date: date,
            timeRange: timeRange,
            shift: shift,
            frontdesk: housekeeper // Using housekeeper array for frontend staff
          };
          existingRoster.dutyOnFrontdesk.push(newEntry);
          console.log(`Created new frontend entry for ${date}`);
        }
      }
    }

    // 7. Save the updated roster
    const updatedRoster = await existingRoster.save();

    // 8. Clean up the response to remove empty arrays
    const cleanedRoster = JSON.parse(JSON.stringify(updatedRoster));
    
    // Remove empty frontdesk arrays from housekeeper entries
    if (cleanedRoster.dutyOnHousekeeper) {
      cleanedRoster.dutyOnHousekeeper = cleanedRoster.dutyOnHousekeeper.map(entry => {
        const cleanEntry = { ...entry };
        if (cleanEntry.frontdesk && cleanEntry.frontdesk.length === 0) {
          delete cleanEntry.frontdesk;
        }
        return cleanEntry;
      });
    }
    
    // Remove empty housekeeper arrays from frontdesk entries
    if (cleanedRoster.dutyOnFrontdesk) {
      cleanedRoster.dutyOnFrontdesk = cleanedRoster.dutyOnFrontdesk.map(entry => {
        const cleanEntry = { ...entry };
        if (cleanEntry.housekeeper && cleanEntry.housekeeper.length === 0) {
          delete cleanEntry.housekeeper;
        }
        return cleanEntry;
      });
    }

    // 9. Populate the results for the response
    const populatedRoster = await DutyOnBoardModel.findById(updatedRoster._id)
      .populate("dutyOnHousekeeper.housekeeper dutyOnFrontdesk.frontdesk")
      .lean(); // Use lean() for better performance and easier manipulation

    // 10. Send success response
    res.status(201).json({
      success: true,
      message: `Duty roster successfully processed for ${allDates.length} days.`,
      data: populatedRoster,
      meta: {
        dateRange: dateRange,
        totalDays: allDates.length,
        department: department,
        isNewDocument: !existingRoster.isModified() // This will be false if document was newly created
      }
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

// Additional helper function to get all rosters
const getAllDutyRosters = async (req, res) => {
  try {
    const rosters = await DutyOnBoardModel.find({})
      .populate("dutyOnHousekeeper.housekeeper dutyOnFrontdesk.frontdesk")
      .sort({ createdAt: -1 })
      .lean();

    // Clean up empty arrays in response
    const cleanedRosters = rosters.map(roster => {
      if (roster.dutyOnHousekeeper) {
        roster.dutyOnHousekeeper = roster.dutyOnHousekeeper.map(entry => {
          if (entry.frontdesk && entry.frontdesk.length === 0) {
            delete entry.frontdesk;
          }
          return entry;
        });
      }
      
      if (roster.dutyOnFrontdesk) {
        roster.dutyOnFrontdesk = roster.dutyOnFrontdesk.map(entry => {
          if (entry.housekeeper && entry.housekeeper.length === 0) {
            delete entry.housekeeper;
          }
          return entry;
        });
      }
      
      return roster;
    });

    res.status(200).json({
      success: true,
      message: `Found ${cleanedRosters.length} duty rosters.`,
      data: cleanedRosters
    });
  } catch (error) {
    console.error("Error fetching duty rosters:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error. Could not fetch rosters.",
      error: error.message,
    });
  }
};

// Function to get roster by date range
const getDutyRosterByDateRange = async (req, res) => {
  try {
    const { dateRange } = req.params;

    if (!dateRange) {
      return res.status(400).json({
        success: false,
        message: "Date range parameter is required.",
      });
    }

    const roster = await DutyOnBoardModel.findOne({ dateRange })
      .populate("dutyOnHousekeeper.housekeeper dutyOnFrontdesk.frontdesk")
      .lean();

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: `No roster found for date range: ${dateRange}`,
      });
    }

    // Clean up empty arrays
    if (roster.dutyOnHousekeeper) {
      roster.dutyOnHousekeeper = roster.dutyOnHousekeeper.map(entry => {
        if (entry.frontdesk && entry.frontdesk.length === 0) {
          delete entry.frontdesk;
        }
        return entry;
      });
    }
    
    if (roster.dutyOnFrontdesk) {
      roster.dutyOnFrontdesk = roster.dutyOnFrontdesk.map(entry => {
        if (entry.housekeeper && entry.housekeeper.length === 0) {
          delete entry.housekeeper;
        }
        return entry;
      });
    }

    res.status(200).json({
      success: true,
      message: `Roster found for date range: ${dateRange}`,
      data: roster
    });
  } catch (error) {
    console.error("Error fetching duty roster by date range:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error. Could not fetch roster.",
      error: error.message,
    });
  }
};

// Function to delete roster by ID
const deleteDutyRoster = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Roster ID is required.",
      });
    }

    const deletedRoster = await DutyOnBoardModel.findByIdAndDelete(id);

    if (!deletedRoster) {
      return res.status(404).json({
        success: false,
        message: "Roster not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Roster deleted successfully.",
      data: deletedRoster
    });
  } catch (error) {
    console.error("Error deleting duty roster:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error. Could not delete roster.",
      error: error.message,
    });
  }
};

const DutyOnBoardController = {
  createADutyOnBoard,
  getAllDutyRosters,
  getDutyRosterByDateRange,
  deleteDutyRoster,
};

module.exports = DutyOnBoardController;