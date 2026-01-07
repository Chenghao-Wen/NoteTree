const express = require("express");
const treeController = require("../controllers/treeController");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

router.post("/:userId/add-node", checkAuth, treeController.addNode);
router.post("/:userId/remove-node", checkAuth, treeController.removeNode);
router.post("/:userId/move-node", checkAuth, treeController.moveNode);

module.exports = router;
