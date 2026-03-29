const mongoose = require("mongoose");

// ─── Reuse connection across serverless invocations ───────────────────────────
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // 1. Already connected — reuse
  if (cached.conn) {
    console.log("⚡ [DB] Reusing existing MongoDB connection");
    return cached.conn;
  }

  // 2. No pending promise — start a new connection
  if (!cached.promise) {
    console.log("🟡 [DB] Connecting to MongoDB...");

    const opts = {
      bufferCommands: false,          // fail fast instead of queuing
      serverSelectionTimeoutMS: 10000, // give up finding a server after 10s
      socketTimeoutMS: 45000,          // close sockets idle > 45s
    };

    cached.promise = mongoose
      .connect(process.env.MONGO_URL, opts)
      .then((mongooseInstance) => {
        console.log("✅ [DB] MongoDB Connected Successfully");
        console.log(
          "📊 [DB] Host:",
          mongooseInstance.connection.host
        );
        console.log(
          "📊 [DB] Database:",
          mongooseInstance.connection.name
        );
        return mongooseInstance;
      })
      .catch((err) => {
        // ⚠️  CRITICAL: reset promise so next request retries instead of
        //    replaying the same rejected promise forever
        console.error("🔴 [DB] Connection failed:", err.message);
        cached.promise = null;
        throw err;
      });
  }

  // 3. Wait for the in-progress promise
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // safety reset
    throw err;
  }

  return cached.conn;
};

// ─── Log any state changes after the initial connection ──────────────────────
mongoose.connection.on("disconnected", () => {
  console.warn("🟠 [DB] MongoDB disconnected");
  cached.conn = null;
  cached.promise = null; // allow reconnect on next request
});

mongoose.connection.on("reconnected", () => {
  console.log("🟢 [DB] MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 [DB] Mongoose error:", err.message);
  cached.conn = null;
  cached.promise = null;
});

module.exports = { connectDB };