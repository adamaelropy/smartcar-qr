const express = require("express");
const { getVehicleByQrToken, postQrMessage } = require("../controllers/qr.controller");

const router = express.Router();

router.get("/:token", getVehicleByQrToken);
router.post("/:token/message", postQrMessage);

module.exports = router;
