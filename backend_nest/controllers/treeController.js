const KnowledgeTree = require("../models/KnowledgeTree");
const HttpError = require("../models/http-error");
const Tree = require("../models/treeSchema");
const path = require("path");
const addNode = async (req, res, next) => {
  const userId = req.userData.userID;
  const { parentName, childName, filePath } = req.body;

  try {
    let treeDoc = await Tree.findOne({ user_id: userId });
    const tree = KnowledgeTree.fromJSON(treeDoc);
    tree.addChild(parentName, childName, filePath);
    tree.saveToFile(treePath);
    res
      .status(200)
      .json({ json: tree.toJSON(), message: "Node added successfully." });
  } catch (err) {
    next(new HttpError(err.message, 500));
  }
};
const removeNode = async (req, res, next) => {
  const { userId } = req.userData.userID;
  const { parentName, childName } = req.body;

  try {
    let treeDoc = await Tree.findOne({ user_id: userId });
    const tree = KnowledgeTree.fromJSON(treeDoc);
    tree.removeChild(parentName, childName);
    tree.saveToFile(treePath);
    res
      .status(200)
      .json({ json: tree.toJSON(), message: "Node removed successfully." });
  } catch (err) {
    next(new HttpError(err.message, 500));
  }
};
const moveNode = async (req, res, next) => {
  const { userId } = req.userData.userID;
  const { newParentName, childName } = req.body;

  try {
    let treeDoc = await Tree.findOne({ user_id: userId });
    const tree = KnowledgeTree.fromJSON(treeDoc);
    tree.moveNode(childName, newParentName);
    tree.saveToFile(treePath);
    res
      .status(200)
      .json({ json: tree.toJSON(), message: "Node moved successfully." });
  } catch (err) {
    next(new HttpError(err.message, 500));
  }
};

exports.addNode = addNode;
exports.removeNode = removeNode;
exports.moveNode = moveNode;
