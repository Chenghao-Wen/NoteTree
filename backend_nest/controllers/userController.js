const UserService = require("../services/userService");
const HttpError = require("../models/http-error");
const fs = require("fs");
const path = require("path");
const KnowledgeTree = require("../models/KnowledgeTree");
const UploadRecord = require("../models/uploadRecordSchema");
const signUp = async (req, res, next) => {
  const { username, email, password } = req.body;

  const existingUser = await UserService.findUserByEmail(email);
  if (existingUser) {
    return next(new HttpError("User Already exist", 400));
  }

  const user = await UserService.createUser({
    username,
    email,
    password,
  });
  const userId = user._id;
  const newTree = await KnowledgeTree.initUserTree(userId); // correctly call the static method
  const token = UserService.generateAuthToken(user);
  res.status(201).json({ user: { username, email }, token });
};

const logIn = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await UserService.findUserByEmail(email);
  if (!user) {
    return next(new HttpError("Wrong email or password", 401));
  }

  const isPasswordValid = await UserService.verifyPassword(
    password,
    user.password
  );

  if (!isPasswordValid) {
    return next(new HttpError("Wrong email or password", 401));
  }

  const token = UserService.generateAuthToken(user);

  res.status(200).json({
    message: "Logged in",
    token,
    user: { id: user.id, email: user.email },
  });
};
const getTree = async (req, res, next) => {
  const userId = req.userData.userID;

  try {
    const tree = await KnowledgeTree.loadFromDB(userId);
    res.status(200).json({
      usertree: tree.toJSON().root,
    });
  } catch (err) {
    console.error("Error loading user tree:", err.message);
    usertree = null;
  }
};

const getUserUploads = async (req, res, next) => {
  const userId = req.userData.userID;

  try {
    // Query MongoDB for all upload records of the user
    const uploadrecords = await UploadRecord.find({ userId })
      .sort({ uploadDate: -1 }) // sort by uploadDate descending (newest first)
      .lean(); // return plain JSON objects instead of Mongoose documents

    res.status(200).json({ uploadrecords });
  } catch (err) {
    console.error("Error loading user upload records:", err.message);
    next(new Error("Failed to fetch upload records")); // 使用错误中间件处理
  }
};

const unmatchedUploads = async (req, res, next) => {
  const userId = req.userData.userID;

  try {
    // Query MongoDB for records of the user where matched is false
    const unmatchedRecords = await UploadRecord.find({
      userId,
      matched: false,
    })
      .sort({ uploadDate: -1 }) // sort by uploadDate descending
      .lean();

    res.status(200).json({ unmatchedRecords });
  } catch (err) {
    console.error("Error loading unmatched upload records:", err.message);
    next(new Error("Failed to fetch unmatched records"));
  }
};

exports.signUp = signUp;
exports.logIn = logIn;
exports.getTree = getTree;
exports.getUserUploads = getUserUploads;
exports.unmatchedUploads = unmatchedUploads;
