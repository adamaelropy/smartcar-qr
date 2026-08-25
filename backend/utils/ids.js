function createBigIntId() {
    return BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));
}

function normalizeConversationPair(firstUserId, secondUserId) {
    return firstUserId < secondUserId
        ? [firstUserId, secondUserId]
        : [secondUserId, firstUserId];
}

module.exports = {
    createBigIntId,
    normalizeConversationPair
};
