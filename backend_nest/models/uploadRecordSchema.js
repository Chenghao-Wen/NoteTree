// models/UploadRecord.js
const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: "User",
    required: true,
  },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  originalName: { type: String, required: true },
  matched: { type: Boolean, default: false },
  // 其他文件元数据（如大小、类型等）可按需添加
});

// 添加索引以加速用户查询
uploadSchema.index({ user_id: 1 });

module.exports = mongoose.model("UploadRecord", uploadSchema);
