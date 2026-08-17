const express = require("express");
const cors = require("cors");
require("dotenv").config();

const prisma = require("./db");
const jwt = require('jsonwebtoken');

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
    const { type = 'MESSAGE', message = '', from = null } = req.body || {};

    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { qr_token: token },
            select: { vehicle_id: true },
        });

        if (!vehicle) {
            console.warn('QR post message: token not found', token?.slice?.(0, 8) || token);
            return res.status(404).json({ success: false, message: 'QR code not found.' });
        }

        const nextId = BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));

        // Attempt to derive source from Authorization header (if visitor is logged in)
        let sourceValue = null;
        try {
            console.log('QR POST incoming. headers authorization:', !!req.headers.authorization, 'body from:', !!from);
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const tokenString = authHeader.slice(7);
                const secret = process.env.JWT_SECRET;
                if (secret) {
                    try {
                        const payload = jwt.verify(tokenString, secret);
                        if (payload && (payload.username || payload.userId)) {
                                    // Prefer sender's vehicle id when available so threads separate by sender vehicle
                                    try {
                                        const senderVehicle = await prisma.vehicle.findUnique({
                                            where: { user_id: payload.userId },
                                            select: { vehicle_id: true },
                                        });

                                        if (senderVehicle && senderVehicle.vehicle_id) {
                                            sourceValue = `vehicle:${senderVehicle.vehicle_id}`;
                                        } else {
                                            sourceValue = payload.username ? `user:${payload.username}` : `userId:${payload.userId}`;
                                        }
                                    } catch (e) {
                                        sourceValue = payload.username ? `user:${payload.username}` : `userId:${payload.userId}`;
                                    }
                                }
                    } catch (e) {
                        // ignore invalid token - fall back to explicit `from` body
                    }
                }
            }

            if (!sourceValue) {
                // Prefer explicit `from` field, or fall back to senderName when provided.
                const candidate = from || (req.body && req.body.senderName) || null;

                if (candidate) {
                    try {
                        // Normalize candidate if it's prefixed like "user:username"
                        let username = null;
                        if (typeof candidate === 'string' && candidate.startsWith('user:')) {
                            username = candidate.split(':')[1];
                        } else if (typeof candidate === 'string' && /^[A-Za-z0-9_\-\.]+$/.test(candidate)) {
                            // treat plain token-like values as possible username
                            username = candidate;
                        }

                        if (username) {
                            const user = await prisma.user.findUnique({ where: { username } });
                            if (user) {
                                const senderVehicle = await prisma.vehicle.findUnique({ where: { user_id: user.user_id }, select: { vehicle_id: true } });
                                if (senderVehicle && senderVehicle.vehicle_id) {
                                    sourceValue = `vehicle:${senderVehicle.vehicle_id}`;
                                } else {
                                    sourceValue = `user:${username}`;
                                }
                            } else {
                                sourceValue = String(candidate);
                            }
                        } else {
                            sourceValue = String(candidate);
                        }
                    } catch (e) {
                        sourceValue = String(candidate);
                    }
                }
            }
            } catch (e) {
                sourceValue = from ? String(from) : null;
            }

            // If still no explicit source (no auth, no `from`), create a pseudo-source
            // based on a fingerprint of the request so different devices map to different threads.
            if (!sourceValue) {
                try {
                    const crypto = require('crypto');
                    const forwarded = req.headers['x-forwarded-for'] || req.connection && req.connection.remoteAddress || req.socket && req.socket.remoteAddress || '';
                    const ua = req.headers['user-agent'] || '';
                    const lang = req.headers['accept-language'] || '';
                    const fingerprint = `${forwarded}|${ua}|${lang}`;
                    const hash = crypto.createHash('sha256').update(fingerprint).digest('hex').slice(0, 8);
                    sourceValue = `anon:${hash}`;
                } catch (e) {
                    // last resort: use literal string so DB gets non-null source
                    sourceValue = `anon:unknown`;
                }
            }

        await prisma.communication.create({
            data: {
                communication_id: nextId,
                vehicle_id: vehicle.vehicle_id,
                type: type === 'CALL' ? 'CALL' : 'MESSAGE',
                direction: 'RECEIVED',
                message: String(message || (type === 'CALL' ? 'Call initiated' : 'No message')),
                source: sourceValue || null,
            },
        });

        console.log('QR message recorded', { vehicle_id: vehicle.vehicle_id, type, source: sourceValue });
        return res.json({ success: true, message: 'Message recorded.' });
    } catch (error) {
        console.error('QR post message error:', error.message, error.stack);
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