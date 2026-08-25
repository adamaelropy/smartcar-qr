const jwt = require("jsonwebtoken");
const prisma = require("../db");
const { createConversationMessage, getOrCreateConversation } = require("./messages.controller");
const { resolveAnonymousSource } = require("../utils/anonymous");
const { createBigIntId } = require("../utils/ids");

async function getVehicleByQrToken(req, res) {
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
                user: { select: { user_id: true, username: true, phone: true } },
            },
        });
        if (!vehicle) return res.status(404).json({ success: false, message: "QR code not found." });
        return res.json({ success: true, vehicle });
    } catch (error) {
        console.error("QR lookup error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to retrieve QR information." });
    }
}

async function postQrMessage(req, res) {
    const { token } = req.params;
    const { type = "MESSAGE", message = "", anonymousId = null } = req.body || {};
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { qr_token: token },
            select: { vehicle_id: true, user_id: true },
        });
        if (!vehicle) {
            console.warn("QR post message: token not found", token?.slice?.(0, 8) || token);
            return res.status(404).json({ success: false, message: "QR code not found." });
        }

        let sourceValue = null;
        let authenticatedSenderId = null;
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith("Bearer ")) {
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
                            } catch {
                                sourceValue = payload.username ? `user:${payload.username}` : `userId:${payload.userId}`;
                            }
                        }
                    } catch {
                        // invalid token -> anonymous
                    }
                }
            }
        } catch {
            // ignore
        }

        const normalizedMessage = String(message || (type === "CALL" ? "Call initiated" : "No message")).trim();
        const messageKind = type === "EMERGENCY" ? "EMERGENCY" : "TEXT";

        if (authenticatedSenderId && vehicle.user_id && authenticatedSenderId !== vehicle.user_id) {
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
            return res.json({ success: true, message: "Message delivered.", threadId: String(conversation.conversation_id) });
        }

        if (authenticatedSenderId && vehicle.user_id && authenticatedSenderId === vehicle.user_id) {
            return res.status(400).json({ success: false, message: "You cannot send a message to your own vehicle." });
        }

        if (!sourceValue) {
            try {
                sourceValue = resolveAnonymousSource(anonymousId);
            } catch {
                sourceValue = "anon:unknown";
            }
        }

        const nextId = createBigIntId();
        await prisma.communication.create({
            data: {
                communication_id: nextId,
                vehicle_id: vehicle.vehicle_id,
                type: type === "CALL" ? "CALL" : "MESSAGE",
                direction: "RECEIVED",
                message: normalizedMessage,
                source: sourceValue || null,
            },
        });

        console.log("QR message recorded", { vehicle_id: vehicle.vehicle_id, type, source: sourceValue });
        return res.json({ success: true, message: "Message recorded." });
    } catch (error) {
        console.error("QR post message error:", error.message, error.stack);
        return res.status(500).json({ success: false, message: "Failed to record message." });
    }
}

module.exports = { getVehicleByQrToken, postQrMessage };
