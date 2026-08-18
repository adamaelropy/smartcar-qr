const prisma = require("../db");

function classifyMessageText(text) {
    const normalized = String(text || "").toLowerCase();
    if (normalized.includes("accident") || normalized.includes("emergency")) return "emergency";
    if (normalized.includes("block") || normalized.includes("blocked") || normalized.includes("blocking")) return "blocked";
    return "message";
}

function formatTime(value) {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function createBigIntId() {
    return BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));
}

function normalizeConversationPair(firstUserId, secondUserId) {
    return firstUserId < secondUserId
        ? [firstUserId, secondUserId]
        : [secondUserId, firstUserId];
}

async function createConversationMessage({ conversationId, senderId, recipientId, body, kind = "TEXT" }) {
    const messageId = createBigIntId();

    await prisma.$transaction([
        prisma.conversationMessage.create({
            data: {
                message_id: messageId,
                conversation_id: conversationId,
                sender_id: senderId,
                recipient_id: recipientId,
                body,
                kind,
            },
        }),
        prisma.conversation.update({
            where: { conversation_id: conversationId },
            data: { last_message_at: new Date() },
        }),
    ]);

    return messageId;
}

async function getOrCreateConversation(userId, otherUserId) {
    const [participantAId, participantBId] = normalizeConversationPair(userId, otherUserId);

    let conversation = await prisma.conversation.findFirst({
        where: {
            participant_a_id: participantAId,
            participant_b_id: participantBId,
        },
        select: { conversation_id: true },
    });

    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                conversation_id: createBigIntId(),
                participant_a_id: participantAId,
                participant_b_id: participantBId,
            },
            select: { conversation_id: true },
        });
    }

    return conversation;
}

async function getMessages(req, res) {
    const userId = req.user.userId;

    try {
        const conversations = await prisma.conversation.findMany({
            where: {
                OR: [
                    { participant_a_id: userId },
                    { participant_b_id: userId },
                ],
            },
            orderBy: { last_message_at: "desc" },
            select: {
                conversation_id: true,
                participant_a_id: true,
                participant_b_id: true,
                participantA: {
                    select: { user_id: true, username: true, name: true },
                },
                participantB: {
                    select: { user_id: true, username: true, name: true },
                },
                messages: {
                    orderBy: { created_at: "asc" },
                    select: {
                        message_id: true,
                        sender_id: true,
                        recipient_id: true,
                        body: true,
                        kind: true,
                        read_at: true,
                        created_at: true,
                    },
                },
            },
        });

        const threads = conversations.map((conversation) => {
            const counterpart = conversation.participant_a_id === userId
                ? conversation.participantB
                : conversation.participantA;
            const lastMessage = conversation.messages[conversation.messages.length - 1] || null;
            const unread = conversation.messages.filter(
                (message) => message.recipient_id === userId && !message.read_at,
            ).length;

            return {
                id: String(conversation.conversation_id),
                senderName: counterpart?.name || counterpart?.username || "User",
                username: counterpart?.username || null,
                preview: lastMessage?.body || "No messages yet.",
                time: lastMessage ? formatTime(lastMessage.created_at) : "",
                unread,
                blocked: conversation.messages.some((message) => classifyMessageText(message.body) === "blocked"),
                emergency: conversation.messages.some((message) => message.kind === "EMERGENCY" || classifyMessageText(message.body) === "emergency"),
                latestIncomingText: [...conversation.messages]
                    .reverse()
                    .find((message) => message.recipient_id === userId)?.body || null,
                messages: conversation.messages.map((message) => ({
                    id: String(message.message_id),
                    sender: message.sender_id === userId ? "me" : "them",
                    text: message.body,
                    time: formatTime(message.created_at),
                    read: Boolean(message.read_at),
                    kind: message.kind,
                })),
            };
        });

        return res.json({ success: true, messages: threads });
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
        return res.status(400).json({ success: false, message: "threadId is required" });
    }

    try {
        const conversationId = BigInt(threadId);
        const conversation = await prisma.conversation.findFirst({
            where: {
                conversation_id: conversationId,
                OR: [
                    { participant_a_id: req.user.userId },
                    { participant_b_id: req.user.userId },
                ],
            },
            select: { conversation_id: true },
        });

        if (!conversation) {
            return res.status(404).json({ success: false, message: "Conversation not found." });
        }

        const result = await prisma.conversationMessage.updateMany({
            where: {
                conversation_id: conversationId,
                recipient_id: req.user.userId,
                read_at: null,
            },
            data: {
                read_at: new Date(),
            },
        });

        return res.json({
            success: true,
            threadId,
            updated: result.count,
        });
    } catch (error) {
        console.error("Mark thread read error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to mark thread read." });
    }
}

async function sendMessage(req, res) {
    const { threadId, message, mode = "default" } = req.body || {};

    if (!threadId) {
        return res.status(400).json({ success: false, message: "Thread id is required." });
    }

    const fallbackReplies = {
        emergency: "I am on my way and I am contacting the emergency services now.",
        blocked: "Hey, sorry I am on my way!",
        default: "",
    };
    const body = String(message || fallbackReplies[mode] || "").trim();

    if (!body) {
        return res.status(400).json({ success: false, message: "Message text is required." });
    }

    try {
        const conversationId = BigInt(threadId);
        const conversation = await prisma.conversation.findFirst({
            where: {
                conversation_id: conversationId,
                OR: [
                    { participant_a_id: req.user.userId },
                    { participant_b_id: req.user.userId },
                ],
            },
            select: {
                conversation_id: true,
                participant_a_id: true,
                participant_b_id: true,
            },
        });

        if (!conversation) {
            return res.status(404).json({ success: false, message: "Conversation not found." });
        }

        const recipientId = conversation.participant_a_id === req.user.userId
            ? conversation.participant_b_id
            : conversation.participant_a_id;

        const kind = mode === "emergency" || classifyMessageText(body) === "emergency"
            ? "EMERGENCY"
            : "TEXT";

        const messageId = await createConversationMessage({
            conversationId,
            senderId: req.user.userId,
            recipientId,
            body,
            kind,
        });

        return res.json({
            success: true,
            threadId,
            message: {
                id: String(messageId),
                sender: "me",
                text: body,
                time: formatTime(new Date()),
                read: false,
                kind,
            },
        });
    } catch (error) {
        console.error("Send message error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to send message." });
    }
}

module.exports = {
    createConversationMessage,
    getOrCreateConversation,
    getMessages,
    markThreadRead,
    sendMessage,
};
