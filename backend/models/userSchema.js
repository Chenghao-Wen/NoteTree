const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: false, // 确保用户名不重复
  },

  // password (stored as hashed value)
  password: {
    type: String,
    required: true,
  },
  // other user info (extend as needed, e.g. email, registration time)
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

// Export model (collection name will be pluralized automatically, e.g. users)
module.exports = mongoose.model("User", userSchema);
