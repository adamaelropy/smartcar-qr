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
                read: true,
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

        const groupMap = new Map();
        const vehicleIdsToLookup = new Set();

        communications.forEach((item) => {
            const isOwner = myVehicleId && item.vehicle_id === myVehicleId;
            const sourceKey = item.source || 'unknown';
            const groupKey = isOwner
                ? `owner_${myVehicleId}_${sourceKey}`
                : `visitor_${item.vehicle_id}_${sourceKey}`;

            if (isOwner && sourceKey.startsWith('vehicle:')) {
                const vId = Number(sourceKey.split(':')[1]);
                if (vId) vehicleIdsToLookup.add(vId);
            }

            if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, {
                    groupKey,
                    isOwner,
                    sourceKey,
                    targetVehicleId: item.vehicle_id,
                    targetVehicle: item.vehicle,
                    items: [],
                });
            }

            groupMap.get(groupKey).items.push(item);
        });

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

        function displayNameForSource(src, isOwner, targetVehicle) {
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
            const { isOwner, sourceKey, targetVehicleId, targetVehicle, items } = group;
            const last = items[items.length - 1];
            const senderName = displayNameForSource(sourceKey, isOwner, targetVehicle);
            const unread = items.filter((i) => i.direction === 'RECEIVED' && !i.read).length;
            const blocked = items.some((i) => classifyMessage(i) === 'blocked');
            const emergency = items.some((i) => classifyMessage(i) === 'emergency');
            const threadId = isOwner
                ? `vehicle-${myVehicleId}-${encodeURIComponent(sourceKey)}`
                : `vehicle-${targetVehicleId}-${encodeURIComponent(sourceKey || 'unknown')}`;

            return {
                id: threadId,
                senderName,
                role: isOwner ? 'Visitor contact' : 'Vehicle contact',
                label: senderName,
                preview: last?.message || 'No messages yet.',
                time: last
                    ? new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now',
                unread,
                blocked,
                emergency,
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

async function markThreadRead(req, res) {
    const { threadId } = req.body || {};

    if (!threadId) {
        return res.status(400).json({ success: false, message: 'threadId is required' });
    }

    try {
        const vehicle = await prisma.vehicle.findUnique({ where: { user_id: req.user.userId }, select: { vehicle_id: true } });
        if (!vehicle) {
            return res.status(404).json({ success: false, message: 'Vehicle not found for this user.' });
        }

        let source = null;
        try {
            const prefix = `vehicle-${vehicle.vehicle_id}-`;
            if (threadId && threadId.startsWith(prefix)) {
                const middle = threadId.slice(prefix.length);
                try {
                    source = decodeURIComponent(middle) || null;
                } catch (e) {
                    source = middle || null;
                }
            }
        } catch (e) {
            source = null;
        }

        if (!source) {
            return res.status(400).json({ success: false, message: 'Invalid thread id' });
        }

        console.log('Marking thread read for vehicle:', vehicle.vehicle_id, 'source:', source);
        // Use raw SQL to update read flag so we don't need to regenerate the Prisma client here
                // Use parameterized raw query to safely pass values
                let result = 0;
                if (source === 'unknown') {
                    // Some old rows use NULL for source; mark those as read as well
                    result = await prisma.$executeRaw`
                        UPDATE "Communication"
                        SET "read" = true
                        WHERE vehicle_id = ${vehicle.vehicle_id}
                          AND (source IS NULL OR source = 'unknown')
                          AND direction = 'RECEIVED'
                          AND "read" = false
                    `;
                } else {
                    result = await prisma.$executeRaw`
                        UPDATE "Communication"
                        SET "read" = true
                        WHERE vehicle_id = ${vehicle.vehicle_id}
                          AND source = ${source}
                          AND direction = 'RECEIVED'
                          AND "read" = false
                    `;
                }

        console.log('raw update result (rows affected):', result);

        return res.json({ success: true, threadId, updated: Number(result || 0) });
    } catch (error) {
        console.error('Mark thread read error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to mark thread read.' });
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
        blocked: "Hey, sorry I am on my way!",
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
        const mySource = myVehicleId
            ? `vehicle:${myVehicleId}`
            : (currentUser.username ? `user:${currentUser.username}` : `userId:${currentUser.user_id}`);

        let targetVehicleId = myVehicleId;
        let targetSource = threadId;
        let direction = 'SENT';

        const threadPrefix = 'vehicle-';
        if (threadId && typeof threadId === 'string' && threadId.startsWith(threadPrefix)) {
            const match = /^vehicle-(\d+)-(.+)$/.exec(threadId);
            if (match) {
                targetVehicleId = Number(match[1]);
                try {
                    targetSource = decodeURIComponent(match[2]);
                } catch (e) {
                    targetSource = match[2];
                }
            }
        }

        if (!targetVehicleId || Number.isNaN(targetVehicleId)) {
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
    markThreadRead,
};
