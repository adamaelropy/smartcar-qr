const express = require("express");
const cors = require("cors");
require("dotenv").config();

const prisma = require("./db");

const serviceRoutes = require("./routes/serviceRoutes");
const authRoutes = require("./routes/auth.routes");
const registrationRoutes = require("./routes/registration.routes");
const messagesRoutes = require("./routes/messages.routes");
const usersRoutes = require("./routes/users.routes");
const { authenticate } = require("./middleware/auth.middleware");

const app = express();
// Disable ETag to avoid 304 responses for dynamic API data
app.disable('etag');
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
// Messages Routes
// ==============================

app.use("/api/messages", messagesRoutes);

// ============================== 
app.use("/api/services", serviceRoutes);
// Users route (protected) - returns usernames and vehicle QR tokens
app.use("/api/users", usersRoutes);

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
            where: { qr_token: token },
            select: {
                vehicle_id: true,
                user_id: true,
                plate_number: true,
                car_name: true,
                year_model: true,
                // include owner contact
                user: {
                    select: {
                        user_id: true,
                        username: true,
                        phone: true,
                    },
                },
            },
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
// Visitor: post message or call for vehicle by qr token
// ==============================

app.post('/api/qr/:token/message', async (req, res) => {
    const { token } = req.params;
    const { type = 'MESSAGE', message = '' } = req.body || {};

    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { qr_token: token },
            select: { vehicle_id: true },
        });

        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'QR code not found.' });
        }

        const nextId = BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));

        await prisma.communication.create({
            data: {
                communication_id: nextId,
                vehicle_id: vehicle.vehicle_id,
                type: type === 'CALL' ? 'CALL' : 'MESSAGE',
                direction: 'RECEIVED',
                message: String(message || (type === 'CALL' ? 'Call initiated' : 'No message')),
            },
        });

        return res.json({ success: true, message: 'Message recorded.' });
    } catch (error) {
        console.error('QR post message error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to record message.' });
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