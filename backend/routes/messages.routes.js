const express = require("express");
const { getMessages, sendAutoReply } = require("../controllers/messages.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authenticate, getMessages);
router.post("/reply", authenticate, sendAutoReply);

module.exports = router;
