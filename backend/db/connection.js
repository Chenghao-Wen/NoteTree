const mongoose = require("mongoose");
const url =
  "mongodb+srv://cbstx602023:cbstx602023@cluster0.dbucd71.mongodb.net/KnowledgeAtlas?retryWrites=true&w=majority&appName=Cluster0";
const connectDB = async () => {
  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
