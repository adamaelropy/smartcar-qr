const express = require("express");
const { getMessages, sendMessage, markThreadRead } = require("../controllers/messages.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authenticate, getMessages);
router.post("/reply", authenticate, sendMessage);
router.post("/send", authenticate, sendMessage);
router.post("/read", authenticate, markThreadRead);

module.exports = router;
