const prisma = require("../db");

const vehicleQrSelect = {
    vehicle_id: true,
    user_id: true,
    plate_number: true,
    car_name: true,
    year_model: true,
    qr_token: true
};

async function getMyVehicleQr(req, res) {
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: {
                user_id: req.user.userId
            },
            select: vehicleQrSelect
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found."
            });
        }

        res.json({
            success: true,
            vehicle
        });
    } catch (error) {
        console.error("My vehicle QR lookup error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve vehicle QR information."
        });
    }
}

async function getVehicleQrById(req, res) {
    const { vehicleId } = req.params;
    const numericVehicleId = Number(vehicleId);

    if (!Number.isInteger(numericVehicleId) || numericVehicleId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid vehicle id."
        });
    }

    try {
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                vehicle_id: numericVehicleId,
                user_id: req.user.userId
            },
            select: vehicleQrSelect
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found."
            });
        }

        res.json({
            success: true,
            vehicle
        });

    } catch (error) {
        console.error("Vehicle QR lookup error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve vehicle QR information."
        });
    }
}

module.exports = {
    getMyVehicleQr,
    getVehicleQrById
};
