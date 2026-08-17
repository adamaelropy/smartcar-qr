const prisma = require("../db");

async function getMessages(req, res) {
    const userId = req.user.userId;

    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { user_id: userId },
            select: {
                vehicle_id: true,
                car_name: true,
                plate_number: true,
            },
        });

        if (!vehicle) {
            return res.json({
                success: true,
                messages: [],
            });
        }

        const communications = await prisma.communication.findMany({
            where: { vehicle_id: vehicle.vehicle_id },
            orderBy: { created_at: 'asc' },
            select: {
                communication_id: true,
                type: true,
                direction: true,
                source: true,
                message: true,
                created_at: true,
            },
        });

        // Classify message category by text
        function classifyMessage(msg) {
            const text = (msg.message || '').toLowerCase();
            if (text.includes('accident') || text.includes('emergency')) return 'emergency';
            if (text.includes('block') || text.includes('blocked') || text.includes('blocking')) return 'blocked';
            return 'message';
        }

        // Group communications into threads by source (sender) only
        const groups = {};
        communications.forEach((item) => {
            const sourceKey = item.source || 'unknown';
            if (!groups[sourceKey]) groups[sourceKey] = [];
            groups[sourceKey].push(item);
        });

        // Resolve vehicle:<id> sources back to usernames where possible so threads show usernames
        const sourceKeys = Object.keys(groups);
        const vehicleIds = sourceKeys
            .filter((s) => typeof s === 'string' && s.startsWith('vehicle:'))
            .map((s) => Number(s.split(':')[1]))
            .filter(Boolean);

        const vehicleMap = {};
        if (vehicleIds.length > 0) {
            const vehicles = await prisma.vehicle.findMany({
                where: { vehicle_id: { in: vehicleIds } },
                select: { vehicle_id: true, user: { select: { username: true } } },
            });

            vehicles.forEach((v) => {
                if (v && v.vehicle_id) {
                    vehicleMap[`vehicle:${v.vehicle_id}`] = v.user && v.user.username ? v.user.username : `vehicle:${v.vehicle_id}`;
                }
            });
        }

        function displayNameForSource(src) {
            if (!src || src === 'unknown') return 'Unknown';
            if (src.startsWith('user:')) return src.split(':')[1] || src;
            if (src.startsWith('vehicle:')) return vehicleMap[src] || src;
            if (src.startsWith('anon:')) return 'Visitor';
            return src;
        }

        const threads = Object.keys(groups).map((sourceKey) => {
            const items = groups[sourceKey];
            const last = items[items.length - 1];
            const senderName = displayNameForSource(sourceKey);
            const unread = items.filter((i) => i.direction === 'RECEIVED').length;
            const blocked = items.some((i) => classifyMessage(i) === 'blocked');
            const emergency = items.some((i) => classifyMessage(i) === 'emergency');

            return {
                id: `vehicle-${vehicle.vehicle_id}-${encodeURIComponent(sourceKey)}`,
                senderName,
                role: 'Automated contact',
                label: senderName === 'Unknown' ? 'Automated message' : senderName,
                preview: last?.message || 'No messages yet.',
                time: last
                    ? new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now',
                unread,
                blocked,
                emergency,
                messages: items.map((item) => ({
                    id: Number(item.communication_id),
                    sender: item.direction === 'RECEIVED' ? 'them' : 'me',
                    text: item.message || 'No message content available.',
                    time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                })),
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
    const { threadId, mode = "default" } = req.body || {};

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

    const reply = replies[mode] || replies.default;

    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { user_id: req.user.userId },
            select: { vehicle_id: true },
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found for this user.",
            });
        }

        const nextId = BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));

        // try to extract source from threadId so the reply is stored on the same thread
        let source = null;
        try {
            const possibleCategories = ['-emergency', '-blocked', '-message'];
            let categorySuffix = null;

            for (const s of possibleCategories) {
                if (threadId.endsWith(s)) {
                    categorySuffix = s;
                    break;
                }
            }

            if (categorySuffix) {
                const prefix = `vehicle-${vehicle.vehicle_id}-`;
                const middle = threadId.slice(prefix.length, threadId.length - categorySuffix.length);
                // decodeURIComponent may throw if malformed, so guard
                try {
                    source = decodeURIComponent(middle) || null;
                } catch (e) {
                    source = middle || null;
                }
            }
        } catch (e) {
            source = null;
        }

        await prisma.communication.create({
            data: {
                communication_id: nextId,
                vehicle_id: vehicle.vehicle_id,
                type: "MESSAGE",
                direction: "SENT",
                message: reply,
                source: source ? String(source) : null,
            },
        });

        return res.json({
            success: true,
            message: reply,
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
