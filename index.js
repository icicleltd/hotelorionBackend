require("dotenv").config();

const app = require("./app");
const { initCronJobs } = require("./services/cronJobs");
const { connectDB } = require("./utils/dbConnect");
const isVercel = process.env.VERCEL === "1";

let dbConnected = false;

// Connect DB once
const connectDatabase = async () => {
  if (!dbConnected) {
    await connectDB();
    console.log("MongoDB Connected Successfully");
    dbConnected = true;
    initCronJobs();
  }
};

// --- Vercel Serverless ---
module.exports = async (req, res) => {
  if (isVercel) {
    await connectDatabase();
    return app(req, res);
  }
};

// --- Local Development ---
if (!isVercel) {
  const port = process.env.PORT || 5000;

  const startServer = async () => {
    try {
      await connectDatabase();

      app.listen(port, () => {
        console.log(`🚀 Server running on http://localhost:${port}`);
      });
    } catch (err) {
      console.error("❌ Failed to start server:", err);
    }
  };

  startServer();
}