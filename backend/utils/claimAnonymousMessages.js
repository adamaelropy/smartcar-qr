const crypto = require("crypto");
const prisma = require("../db");

// Same validation as QR flow: UUID or generic 8-128 alphanumeric + _-
function isValidAnonymousId(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length < 8 || trimmed.length > 128) return false;
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed);
  const isGeneric = /^[A-Za-z0-9_-]{8,128}$/.test(trimmed);
  return (isUuid || isGeneric);
}

function hashAnonymousId(anonymousId) {
  const trimmed = String(anonymousId).trim();
  if (!isValidAnonymousId(trimmed)) return null;
  return crypto.createHash("sha256").update(trimmed).digest("hex").slice(0, 12);
}

function classifyMessageText(text) {
  const normalized = String(text || "").toLowerCase();
  if (normalized.includes("accident") || normalized.includes("emergency")) return "emergency";
  if (normalized.includes("block") || normalized.includes("blocked") || normalized.includes("blocking")) return "blocked";
  return "message";
}

function createBigIntId() {
  return BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));
}

function normalizeConversationPair(firstUserId, secondUserId) {
  return firstUserId < secondUserId ? [firstUserId, secondUserId] : [secondUserId, firstUserId];
}

/**
 * Claim anonymous Communication records for a newly created user.
 * @param {number} userId - newly created user id
 * @param {string} anonymousId - raw anonymous UUID from client (e.g. 8e34069d-...)
 * @returns {{claimedCount: number, conversationIds: bigint[], skippedVehicles: number[]}}
 */
async function claimAnonymousMessages(userId, anonymousId) {
  if (!userId || !Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid userId for claimAnonymousMessages");
  }
  if (typeof anonymousId !== "string") {
    return { claimedCount: 0, conversationIds: [], skipped: 0 };
  }
  const trimmed = anonymousId.trim();
  if (!isValidAnonymousId(trimmed)) {
    // invalid anonymousId => nothing to claim, but not an error
    return { claimedCount: 0, conversationIds: [], skipped: 0 };
  }
  const anonHash = hashAnonymousId(trimmed);
  if (!anonHash) {
    return { claimedCount: 0, conversationIds: [], skipped: 0 };
  }
  const source = `anon:${anonHash}`;

  // Find unclaimed communications for this hash
  const communications = await prisma.communication.findMany({
    where: {
      source,
      claimed_by_user_id: null,
      // also ensure not already claimed via conversation_id (defensive)
      conversation_id: null,
    },
    orderBy: { created_at: "asc" },
    select: {
      communication_id: true,
      vehicle_id: true,
      message: true,
      type: true,
      created_at: true,
      read: true,
      vehicle: {
        select: { vehicle_id: true, user_id: true },
      },
    },
  });

  if (communications.length === 0) {
    return { claimedCount: 0, conversationIds: [], skipped: 0 };
  }

  // Group by vehicle_id
  const grouped = new Map();
  for (const comm of communications) {
    const vid = comm.vehicle_id;
    if (!grouped.has(vid)) grouped.set(vid, []);
    grouped.get(vid).push(comm);
  }

  const claimedConversationIds = new Set();
  let totalClaimed = 0;

  // Transaction for atomicity
  await prisma.$transaction(async (tx) => {
    for (const [vehicleId, comms] of grouped.entries()) {
      // Determine vehicle owner
      // Use included vehicle relation if available, else fetch
      let ownerId = null;
      if (comms[0].vehicle && comms[0].vehicle.user_id) {
        ownerId = comms[0].vehicle.user_id;
      } else {
        const vehicle = await tx.vehicle.findUnique({
          where: { vehicle_id: vehicleId },
          select: { user_id: true },
        });
        if (!vehicle) continue; // skip safely if owner cannot be determined
        ownerId = vehicle.user_id;
      }
      if (!ownerId || !Number.isInteger(ownerId)) continue;

      // Skip self-conversation
      if (ownerId === userId) {
        // Do not create self-conversation; leave communications unclaimed? Or mark as claimed but without conversation?
        // Spec: If new user is already owner of that vehicle, do NOT create self-conversation. Handle this safely.
        // Decision: skip migration for this vehicle, leave unclaimed to avoid self-conversation.
        continue;
      }

      // Find or create Conversation between new user and owner (idempotent)
      const [participantAId, participantBId] = normalizeConversationPair(userId, ownerId);

      let conversation = await tx.conversation.findFirst({
        where: {
          participant_a_id: participantAId,
          participant_b_id: participantBId,
        },
        select: { conversation_id: true, last_message_at: true },
      });

      if (!conversation) {
        // Create new conversation; last_message_at will be updated after messages inserted
        // Determine latest created_at among comms for initial last_message_at
        let latest = comms[comms.length - 1].created_at;
        // Ensure latest is valid
        if (!latest) latest = new Date();
        conversation = await tx.conversation.create({
          data: {
            conversation_id: createBigIntId(),
            participant_a_id: participantAId,
            participant_b_id: participantBId,
            last_message_at: latest,
          },
          select: { conversation_id: true, last_message_at: true },
        });
      }
      const conversationId = conversation.conversation_id;
      claimedConversationIds.add(conversationId);

      // Sort comms by created_at to preserve ordering
      comms.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      let maxCreatedAt = conversation.last_message_at ? new Date(conversation.last_message_at) : null;

      for (const comm of comms) {
        // Re-check idempotency inside transaction (defensive)
        // Ensure this comm hasn't been claimed concurrently
        const fresh = await tx.communication.findUnique({
          where: { communication_id: comm.communication_id },
          select: { claimed_by_user_id: true, conversation_id: true },
        });
        if (fresh && (fresh.claimed_by_user_id !== null || fresh.conversation_id !== null)) {
          continue;
        }

        const bodyText = comm.message || "";
        // Determine kind: emergency if type was EMERGENCY or message text indicates emergency
        // CommunicationType currently only MESSAGE/CALL, but check legacy
        const isEmergency = classifyMessageText(bodyText) === "emergency";
        const kind = isEmergency ? "EMERGENCY" : "TEXT";

        const messageId = createBigIntId();

        await tx.conversationMessage.create({
          data: {
            message_id: messageId,
            conversation_id: conversationId,
            sender_id: userId,
            recipient_id: ownerId,
            body: bodyText,
            kind,
            created_at: comm.created_at,
            // Preserve read state: if original was read, mark as read_at = claimed time? else null (unread)
            // To keep owner seeing unread after claim unless it was already read, we only set read_at if original read true
            read_at: comm.read ? new Date() : null,
          },
        });

        // Update conversation last_message_at to latest message's created_at if newer
        const commTime = new Date(comm.created_at).getTime();
        if (!maxCreatedAt || commTime > maxCreatedAt.getTime()) {
          maxCreatedAt = new Date(comm.created_at);
        }

        await tx.communication.update({
          where: { communication_id: comm.communication_id },
          data: {
            claimed_by_user_id: userId,
            conversation_id: conversationId,
            claimed_at: new Date(),
          },
        });

        totalClaimed += 1;
      }

      // Update conversation last_message_at to max created_at among migrated messages (preserve history)
      if (maxCreatedAt) {
        await tx.conversation.update({
          where: { conversation_id: conversationId },
          data: { last_message_at: maxCreatedAt },
        });
      }
    }
  });

  return {
    claimedCount: totalClaimed,
    conversationIds: Array.from(claimedConversationIds).map((id) => String(id)),
  };
}

module.exports = {
  claimAnonymousMessages,
  hashAnonymousId,
  isValidAnonymousId,
};
