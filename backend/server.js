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
const { createConversationMessage, getOrCreateConversation } = require("./controllers/messages.controller");

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
    const { type = 'MESSAGE', message = '', from = null, anonymousId = null } = req.body || {};

    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { qr_token: token },
            select: { vehicle_id: true, user_id: true },
        });

        if (!vehicle) {
            console.warn('QR post message: token not found', token?.slice?.(0, 8) || token);
            return res.status(404).json({ success: false, message: 'QR code not found.' });
        }

        // Derive authenticated sender strictly from verified JWT. Do NOT trust client-supplied `from`/`senderName` for identity.
        let sourceValue = null;
        let authenticatedSenderId = null;
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const tokenString = authHeader.slice(7);
                const secret = process.env.JWT_SECRET;
                if (secret) {
                    try {
                        const payload = jwt.verify(tokenString, secret);
                        if (payload && payload.userId) {
                            authenticatedSenderId = payload.userId;
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
                        // invalid token -> treat as anonymous, never trust `from`
                    }
                }
            }
        } catch (e) {
            // ignore
        }

            const normalizedMessage = String(message || (type === 'CALL' ? 'Call initiated' : 'No message')).trim();
            const messageKind = type === 'EMERGENCY' ? 'EMERGENCY' : 'TEXT';

            if (
                authenticatedSenderId &&
                vehicle.user_id &&
                authenticatedSenderId !== vehicle.user_id
            ) {
                const conversation = await getOrCreateConversation(authenticatedSenderId, vehicle.user_id);
                await createConversationMessage({
                    conversationId: conversation.conversation_id,
                    senderId: authenticatedSenderId,
                    recipientId: vehicle.user_id,
                    body: normalizedMessage,
                    kind: messageKind,
                });

                console.log("QR message delivered to conversation", {
                    conversation_id: String(conversation.conversation_id),
                    sender_id: authenticatedSenderId,
                    recipient_id: vehicle.user_id,
                });

                return res.json({
                    success: true,
                    message: "Message delivered.",
                    threadId: String(conversation.conversation_id),
                });
            }

            if (authenticatedSenderId && vehicle.user_id && authenticatedSenderId === vehicle.user_id) {
                return res.status(400).json({
                    success: false,
                    message: "You cannot send a message to your own vehicle.",
                });
            }

            // Anonymous: use stable per-device anonymousId hashed server-side. Do NOT use IP/UA as primary.
            if (!sourceValue) {
                try {
                    const crypto = require('crypto');
                    let anonHash = null;
                    if (typeof anonymousId === 'string') {
                        const trimmed = anonymousId.trim();
                        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed);
                        const isGeneric = /^[A-Za-z0-9_-]{8,128}$/.test(trimmed);
                        if ((isUuid || isGeneric) && trimmed.length >= 8 && trimmed.length <= 128) {
                            anonHash = crypto.createHash('sha256').update(trimmed).digest('hex').slice(0, 12);
                        }
                    }
                    if (!anonHash) {
                        // Safe server-generated fallback so message is not lost (handles missing/malformed anonymousId)
                        let fallbackRaw;
                        try {
                            fallbackRaw = crypto.randomUUID();
                        } catch {
                            fallbackRaw = crypto.randomBytes(16).toString('hex');
                        }
                        anonHash = crypto.createHash('sha256').update(String(fallbackRaw)).digest('hex').slice(0, 12);
                    }
                    sourceValue = `anon:${anonHash}`;
                } catch (e) {
                    sourceValue = `anon:unknown`;
                }
            }

        const nextId = BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));

        await prisma.communication.create({
            data: {
                communication_id: nextId,
                vehicle_id: vehicle.vehicle_id,
                type: type === 'CALL' ? 'CALL' : 'MESSAGE',
                direction: 'RECEIVED',
                message: normalizedMessage,
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

if (require.main === module) {
    app.listen(PORT, () => {
      console.log(
        `SmartCar QR Backend running on http://localhost:${PORT}`
      );
    });
  }
  
  module.exports = app;