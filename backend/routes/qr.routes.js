const express = require("express");
const router = express.Router();
const {
    getVehicleByQrToken,
    postQrMessage
} = require("../controllers/qr.controller");

// Get vehicle by QR token (public)
router.get("/:token", getVehicleByQrToken);

// Post message to vehicle via QR token (public, but can be authenticated)
router.post("/:token/message", postQrMessage);

module.exports = router;
