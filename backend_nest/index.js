const express = require("express");
const bodyparser = require("body-parser");
require("dotenv").config();
const app = express();
const userRoutes = require("./routes/userRoutes");
const fileRoutes = require("./routes/fileRoute");
const treeRoutes = require("./routes/treeRoutes");
const port = process.env.PORT || 3000;

const connectDB = require("./db/connection");
app.use(bodyparser.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE");
  next();
});
app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res
    .status(error.code || 500)
    .json({ message: error.message || "An unknown error occurred!" });
});
app.use("/api/tree", treeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);

connectDB().then(() => {
  app.listen(port, () => {
    console.log("server on 5000");
  });
});
