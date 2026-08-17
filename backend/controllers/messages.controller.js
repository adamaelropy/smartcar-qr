const prisma = require("../db");

// Classify message category by text
function classifyMessage(msg) {
    const text = (msg?.message || '').toLowerCase();
    if (text.includes('accident') || text.includes('emergency')) return 'emergency';
    if (text.includes('block') || text.includes('blocked') || text.includes('blocking')) return 'blocked';
    return 'message';
}

async function getMessages(req, res) {
    const userId = req.user.userId;

    try {
        const currentUser = await prisma.user.findUnique({
            where: { user_id: userId },
            select: {
                user_id: true,
                username: true,
                vehicle: {
                    select: {
                        vehicle_id: true,
                        car_name: true,
                        plate_number: true,
                        qr_token: true,
                    },
                },
            },
        });

        if (!currentUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const myVehicleId = currentUser.vehicle?.vehicle_id || null;
        const myUsername = currentUser.username || null;
        const mySources = [
            myVehicleId ? `vehicle:${myVehicleId}` : null,
            myUsername ? `user:${myUsername}` : null,
            `userId:${userId}`,
        ].filter(Boolean);

        const whereConditions = [];
        if (myVehicleId) {
            whereConditions.push({ vehicle_id: myVehicleId });
        }
        if (mySources.length > 0) {
            whereConditions.push({ source: { in: mySources } });
        }

        if (whereConditions.length === 0) {
            return res.json({ success: true, messages: [] });
        }

        const communications = await prisma.communication.findMany({
            where: { OR: whereConditions },
            orderBy: { created_at: 'asc' },
            select: {
                communication_id: true,
                vehicle_id: true,
                type: true,
                direction: true,
                source: true,
                message: true,
                created_at: true,
                vehicle: {
                    select: {
                        vehicle_id: true,
                        car_name: true,
                        plate_number: true,
                        user: {
                            select: {
                                user_id: true,
                                username: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        // Group communications into conversation threads
        const groupMap = new Map();

        // Collect external vehicle IDs and usernames to resolve display names
        const vehicleIdsToLookup = new Set();
        const usernamesToLookup = new Set();

        communications.forEach((item) => {
            const isOwner = myVehicleId && item.vehicle_id === myVehicleId;
            let groupKey;

            if (isOwner) {
                // I am the vehicle owner; conversation is grouped by sender source
                const src = item.source || 'unknown';
                groupKey = `owner_${myVehicleId}_${src}`;
                if (src.startsWith('vehicle:')) {
                    const vId = Number(src.split(':')[1]);
                    if (vId) vehicleIdsToLookup.add(vId);
                } else if (src.startsWith('user:')) {
                    const uName = src.split(':')[1];
                    if (uName) usernamesToLookup.add(uName);
                }
            } else {
                // I am the visitor who messaged another vehicle; conversation is grouped by that vehicle
                groupKey = `visitor_${item.vehicle_id}_${item.source || mySources[0] || 'me'}`;
            }

            if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, {
                    groupKey,
                    isOwner,
                    targetVehicleId: item.vehicle_id,
                    sourceKey: item.source || 'unknown',
                    items: [],
                    targetVehicle: item.vehicle,
                });
            }

            groupMap.get(groupKey).items.push(item);
        });

        // Resolve vehicle IDs to owner usernames
        const vehicleOwnerMap = {};
        if (vehicleIdsToLookup.size > 0) {
            const resolvedVehicles = await prisma.vehicle.findMany({
                where: { vehicle_id: { in: Array.from(vehicleIdsToLookup) } },
                select: {
                    vehicle_id: true,
                    car_name: true,
                    user: { select: { username: true, name: true } },
                },
            });

            resolvedVehicles.forEach((v) => {
                vehicleOwnerMap[`vehicle:${v.vehicle_id}`] = v.user?.username || v.car_name || `Vehicle #${v.vehicle_id}`;
            });
        }

        function resolveSenderDisplayName(src, isOwner, targetVehicle) {
            if (!isOwner && targetVehicle) {
                return targetVehicle.user?.username || targetVehicle.car_name || 'Vehicle Owner';
            }
            if (!src || src === 'unknown') return 'Visitor';
            if (src.startsWith('user:')) return src.split(':')[1] || 'User';
            if (src.startsWith('vehicle:')) return vehicleOwnerMap[src] || src;
            if (src.startsWith('visitor:') || src.startsWith('anon:')) return 'Visitor';
            return src;
        }

        const threads = Array.from(groupMap.values()).map((group) => {
            const { isOwner, targetVehicleId, sourceKey, items, targetVehicle } = group;
            const last = items[items.length - 1];
            const senderName = resolveSenderDisplayName(sourceKey, isOwner, targetVehicle);

            // Compute unread count based on role
            const unreadCount = items.filter((i) => {
                if (isOwner) {
                    return i.direction === 'RECEIVED';
                } else {
                    return i.direction === 'SENT';
                }
            }).length;

            const isBlocked = items.some((i) => classifyMessage(i) === 'blocked');
            const isEmergency = items.some((i) => classifyMessage(i) === 'emergency');

            const threadId = isOwner
                ? `vehicle-${targetVehicleId}-${encodeURIComponent(sourceKey)}`
                : `thread-out-${targetVehicleId}-${encodeURIComponent(sourceKey)}`;

            return {
                id: threadId,
                senderName,
                role: isOwner ? 'Visitor contact' : 'Vehicle contact',
                label: senderName,
                preview: last?.message || 'No messages yet.',
                time: last
                    ? new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now',
                unread: unreadCount,
                blocked: isBlocked,
                emergency: isEmergency,
                messages: items.map((item) => {
                    let senderType;
                    if (isOwner) {
                        senderType = item.direction === 'RECEIVED' ? 'them' : 'me';
                    } else {
                        senderType = item.direction === 'RECEIVED' ? 'me' : 'them';
                    }

                    return {
                        id: Number(item.communication_id),
                        sender: senderType,
                        text: item.message || 'No message content.',
                        time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    };
                }),
            };
        });

        return res.json({
            success: true,
            messages: threads,
        });
    } catch (error) {
        console.error("Get messages error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve messages.",
        });
    }
}

async function sendAutoReply(req, res) {
    const { threadId, mode = "default", message: customMessage = null } = req.body || {};

    if (!threadId) {
        return res.status(400).json({
            success: false,
            message: "Thread id is required.",
        });
    }

    const replies = {
        emergency: "I am on my way and I am contacting the emergency services now.",
        blocked: "Okay sorry, I am on my way!",
        default: "Thank you for reaching out. Your message has been received and an automated response has been sent.",
    };

    const replyText = customMessage && typeof customMessage === 'string' && customMessage.trim()
        ? customMessage.trim()
        : (replies[mode] || replies.default);

    try {
        const currentUser = await prisma.user.findUnique({
            where: { user_id: req.user.userId },
            select: {
                user_id: true,
                username: true,
                vehicle: { select: { vehicle_id: true } },
            },
        });

        if (!currentUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const myVehicleId = currentUser.vehicle?.vehicle_id || null;
        const mySource = myVehicleId ? `vehicle:${myVehicleId}` : (currentUser.username ? `user:${currentUser.username}` : `userId:${currentUser.user_id}`);

        let targetVehicleId = myVehicleId;
        let targetSource = null;
        let direction = "SENT";

        // Case 1: Owner replying in thread `vehicle-${myVehicleId}-${encodedSource}`
        if (myVehicleId && threadId.startsWith(`vehicle-${myVehicleId}-`)) {
            targetVehicleId = myVehicleId;
            const encoded = threadId.slice(`vehicle-${myVehicleId}-`.length);
            try {
                targetSource = decodeURIComponent(encoded);
            } catch {
                targetSource = encoded;
            }
            direction = "SENT";
        }
        // Case 2: Visitor replying to a vehicle in thread `thread-out-${targetVehicleId}-${encodedSource}`
        else if (threadId.startsWith('thread-out-')) {
            const parts = threadId.split('-');
            targetVehicleId = Number(parts[2]);
            targetSource = mySource;
            direction = "RECEIVED";
        }
        // Case 3: Fallback parsing
        else if (threadId.startsWith('vehicle-')) {
            const parts = threadId.split('-');
            targetVehicleId = Number(parts[1]) || myVehicleId;
            const encoded = parts.slice(2).join('-');
            try {
                targetSource = decodeURIComponent(encoded);
            } catch {
                targetSource = encoded;
            }
            direction = (myVehicleId && targetVehicleId === myVehicleId) ? "SENT" : "RECEIVED";
        } else {
            targetVehicleId = myVehicleId;
            targetSource = threadId;
            direction = "SENT";
        }

        if (!targetVehicleId) {
            return res.status(400).json({
                success: false,
                message: "No vehicle destination found for this thread.",
            });
        }

        const nextId = BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));

        await prisma.communication.create({
            data: {
                communication_id: nextId,
                vehicle_id: targetVehicleId,
                type: "MESSAGE",
                direction,
                message: replyText,
                source: targetSource ? String(targetSource) : mySource,
            },
        });

        return res.json({
            success: true,
            message: replyText,
            threadId,
        });
    } catch (error) {
        console.error("Send auto reply error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to send automated reply.",
        });
    }
}

module.exports = {
    getMessages,
    sendAutoReply,
};
