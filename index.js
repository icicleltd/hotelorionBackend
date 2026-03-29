require("dotenv").config();
const app = require("./app");

const isVercel = process.env.VERCEL === "1";

// Vercel serverless — NO connectDB here, app middleware handles it
const handler = async function (req, res) {
  return app(req, res); // ✅ Removed connectDB() from here
};

module.exports = handler;

// Local dev only
if (!isVercel) {
  const { connectDB } = require("./utils/dbConnect");
  const port = process.env.PORT || 8000;

  const startServer = async () => {
    try {
      await connectDB();
      app.listen(port, () => {
        console.log("🚀 Server running on http://localhost:" + port);
      });
    } catch (err) {
      console.error("❌ Failed to start server:", err);
    }
  };

  startServer();
}