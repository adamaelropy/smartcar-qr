const prisma = require("../db");
const jwt = require('jsonwebtoken');
const { createConversationMessage, getOrCreateConversation } = require("./messages.controller");

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
}

async function postQrMessage(req, res) {
    const { token } = req.params;
    const { type = 'MESSAGE', message = '', from = null } = req.body || {};

    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { qr_token: token },
            select: { vehicle_id: true, user_id: true },
        });

        if (!vehicle) {
            console.warn('QR post message: token not found', token?.slice?.(0, 8) || token);
            return res.status(404).json({ success: false, message: 'QR code not found.' });
        }

        // Attempt to derive source from Authorization header (if visitor is logged in)
        let sourceValue = null;
        let authenticatedSenderId = null;
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
                                    authenticatedSenderId = payload.userId || null;
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
}

module.exports = {
    getVehicleByQrToken,
    postQrMessage
};
