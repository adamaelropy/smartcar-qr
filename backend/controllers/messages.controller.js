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
            orderBy: { created_at: "desc" },
            select: {
                communication_id: true,
                type: true,
                direction: true,
                message: true,
                created_at: true,
            },
        });

        const sortedMessages = [...communications].sort(
            (left, right) =>
                new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
        );

        const thread = {
            id: `vehicle-${vehicle.vehicle_id}`,
            senderName: vehicle.car_name || "QR message center",
            role: "Automated contact",
            label: sortedMessages.some((item) => item.type === "CALL") ? "Calls and messages" : "Automated message",
            preview:
                sortedMessages[sortedMessages.length - 1]?.message ||
                "No messages yet.",
            time:
                sortedMessages.length > 0
                    ? new Date(sortedMessages[sortedMessages.length - 1].created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })
                    : "Just now",
            unread: sortedMessages.filter((item) => item.direction === "RECEIVED").length,
            blocked: false,
            emergency: sortedMessages.some(
                (item) =>
                    item.message?.toLowerCase().includes("accident") ||
                    item.message?.toLowerCase().includes("emergency"),
            ),
            messages: sortedMessages.map((item) => ({
                id: Number(item.communication_id),
                sender: item.direction === "RECEIVED" ? "them" : "me",
                text: item.message || "No message content available.",
                time: new Date(item.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            })),
        };

        return res.json({
            success: true,
            messages: sortedMessages.length > 0 ? [thread] : [],
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

        const nextId =
            BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));

        await prisma.communication.create({
            data: {
                communication_id: nextId,
                vehicle_id: vehicle.vehicle_id,
                type: "MESSAGE",
                direction: "SENT",
                message: reply,
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
