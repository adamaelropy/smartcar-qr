const express = require("express");
const cors = require("cors");
require("dotenv").config();

const prisma = require("./db");

const serviceRoutes = require("./routes/serviceRoutes");
const authRoutes = require("./routes/auth.routes");
const registrationRoutes = require("./routes/registration.routes");
const { authenticate } = require("./middleware/auth.middleware");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==============================
// Test Backend
// ==============================

app.get("/", (req, res) => {
    res.json({
        message: "SmartCar QR Backend is running!"
    });
});

// ==============================
// Test Supabase / Prisma Connection
// ==============================

app.get("/api/test-db", async (req, res) => {
    try {
        const result = await prisma.$queryRaw`SELECT 1 AS result`;

        res.json({
            success: true,
            message: "Supabase PostgreSQL connection successful!",
            result: Number(result[0].result)
        });

    } catch (error) {
        console.error("Database connection error:", error.message);

        res.status(500).json({
            success: false,
            message: "Supabase PostgreSQL connection failed."
        });
    }
});

const vehicleQrSelect = {
    vehicle_id: true,
    user_id: true,
    plate_number: true,
    car_name: true,
    year_model: true,
    qr_token: true
};

// ==============================
// Authentication Routes
// ==============================

app.use("/api/auth", authRoutes);

// ==============================
// Registration Routes
// ==============================

app.use("/api/registration", registrationRoutes);

// ==============================
// Services Routes
// ==============================

app.use("/api/services", serviceRoutes);

// ==============================
// Get Authenticated User Vehicle QR Information
// ==============================

app.get("/api/vehicles/me/qr", authenticate, async (req, res) => {
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
});

// ==============================
// Get Vehicle Using QR Token
// ==============================

app.get("/api/qr/:token", async (req, res) => {
    const { token } = req.params;

    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: {
                qr_token: token
            },
            select: {
                vehicle_id: true,
                user_id: true,
                plate_number: true,
                car_name: true,
                year_model: true
            }
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "QR code not found."
            });
        }

        res.json({
            success: true,
            vehicle
        });

    } catch (error) {
        console.error("QR lookup error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve QR information."
        });
    }
});

// ==============================
// Get Vehicle QR Information
// ==============================

app.get("/api/vehicles/:vehicleId/qr", authenticate, async (req, res) => {
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
});

// ==============================
// Start Server
// ==============================

app.listen(PORT, () => {
    console.log(
        `SmartCar QR Backend running on http://localhost:${PORT}`
    );
});