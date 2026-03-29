const { default: mongoose } = require("mongoose");

// const connectDb = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URL);
//     console.log("MongoDB Connected Successfully");
//   } catch (error) {
//     throw error;
//   }
// };




let isConnected = false;

 const connectDB = async () => {
  if (isConnected) {
    // Already connected
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URL, {
      bufferCommands: false,
    });

    isConnected = db.connections[0].readyState === 1;
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    // throw new AppError(500, "Mongodb connect error");
  }
};
module.exports = { connectDB };