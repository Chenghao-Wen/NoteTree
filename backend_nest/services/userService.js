const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const User = require("../models/userSchema");
const findUserByEmail = async (email) => {
  const existingUser = await User.findOne({ email });
  return existingUser;
};
const createUser = async ({ username, email, password }) => {
  const passwordHashed = await bcrypt.hash(password, 10);
  const newUser = new User({
    username: username,
    password: passwordHashed,
    email: email,
  });

  await newUser.save();

  return newUser;
};

const generateAuthToken = (user) => {
  return jwt.sign({ userID: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "1h",
  });
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  findUserByEmail,
  createUser,
  generateAuthToken,
  verifyPassword,
};
