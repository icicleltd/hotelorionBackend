// const { default: mongoose } = require("mongoose");

// // const connectDb = async () => {
// //   try {
// //     await mongoose.connect(process.env.MONGO_URL);
// //     console.log("MongoDB Connected Successfully");
// //   } catch (error) {
// //     throw error;
// //   }
// // };




// let isConnected = false;

//  const connectDB = async () => {
//   if (isConnected) {
//     // Already connected
//     return;
//   }

//   try {
//     const db = await mongoose.connect(process.env.MONGO_URL, {
//       bufferCommands: false,
//     });

//     isConnected = db.connections[0].readyState === 1;
//     console.log("MongoDB connected");
//   } catch (error) {
//     console.error("MongoDB connection failed:", error);
//     // throw new AppError(500, "Mongodb connect error");
//   }
// };
// module.exports = { connectDB };


const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is missing");
    }

    cached.promise = mongoose.connect(process.env.MONGO_URL, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = { connectDB };