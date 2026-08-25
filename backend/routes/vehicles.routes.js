const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const { getMyVehicleQr, getVehicleQrById } = require("../controllers/vehicles.controller");

const router = express.Router();

router.get("/me/qr", authenticate, getMyVehicleQr);
router.get("/:vehicleId/qr", authenticate, getVehicleQrById);

module.exports = router;
