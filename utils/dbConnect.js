const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  try {
    if (cached.conn) {
      console.log("⚡ MongoDB already connected (cached)");
      return cached.conn;
    }

    if (!cached.promise) {
      cached.promise = mongoose.connect(process.env.MONGO_URL, {
        bufferCommands: false,
      });
    }

    cached.conn = await cached.promise;

    console.log("✅ MongoDB Connected Successfully (Local)");

    console.log("📊 Connection State:", mongoose.connection.readyState);

    return cached.conn;
  } catch (error) {
    console.log("❌ MongoDB Connection Failed:", error.message);
    throw error;
  }
};

module.exports = { connectDB };