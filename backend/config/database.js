const mongoose = require("mongoose");

async function connectDatabase(uri) {
  if (!uri) {
    throw new Error("MONGO_URI is required. Copy backend/.env.example to backend/.env and configure it.");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");
}

module.exports = connectDatabase;
