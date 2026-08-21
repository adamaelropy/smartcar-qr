const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const {
    getMyVehicleQr,
    getVehicleQrById
} = require("../controllers/vehicles.controller");

// Get authenticated user's vehicle QR
router.get("/me/qr", authenticate, getMyVehicleQr);

// Get vehicle QR by vehicle ID
router.get("/:vehicleId/qr", authenticate, getVehicleQrById);

module.exports = router;
