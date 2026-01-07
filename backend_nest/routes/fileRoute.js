const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const checkAuth = require("../middleware/check-auth");
router.post("/upload", checkAuth, fileController.uploadFiles);

router.get(
  "/fetch",
  checkAuth,
  fileController.fetchFileByPath
);

module.exports = router;
