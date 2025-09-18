const mongoose = require("mongoose");

const TreeNodeSchema = new mongoose.Schema({
  name: String,
  files: [String], // 关联的文件名
  children: [this], // 递归嵌套子节点
});

const TreeSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  root: TreeNodeSchema, // 根节点
});

module.exports = mongoose.model("Tree", TreeSchema);
