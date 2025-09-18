const express = require("express");
const check = require("express-validator");
const router = express.Router();

const userController = require("../controllers/userController");
const checkAuth = require("../middleware/check-auth");

router.post("/login", userController.logIn);
router.post("/signup", userController.signUp);
router.get("/getTree", checkAuth, userController.getTree);
router.get("/uploadRecords", checkAuth, userController.getUserUploads);
router.get("/unmatchedRecords", checkAuth, userController.unmatchedUploads);
module.exports = router;
