const crypto = require("crypto");

function isValidAnonymousId(value) {
    if (typeof value !== "string") return false;
    const trimmed = value.trim();
    if (trimmed.length < 8 || trimmed.length > 128) return false;
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed);
    const isGeneric = /^[A-Za-z0-9_-]{8,128}$/.test(trimmed);
    return isUuid || isGeneric;
}

function hashAnonymousId(anonymousId) {
    const trimmed = String(anonymousId).trim();
    if (!isValidAnonymousId(trimmed)) return null;
    return crypto.createHash("sha256").update(trimmed).digest("hex").slice(0, 12);
}

function resolveAnonymousSource(anonymousId) {
    const hash = hashAnonymousId(anonymousId);
    if (hash) return `anon:${hash}`;
    // Generate fallback hash for missing/malformed ids (preserves anonymous message via unique source)
    let fallbackRaw;
    try {
        fallbackRaw = crypto.randomUUID();
    } catch {
        fallbackRaw = crypto.randomBytes(16).toString("hex");
    }
    return `anon:${crypto.createHash("sha256").update(String(fallbackRaw)).digest("hex").slice(0, 12)}`;
}

module.exports = {
    isValidAnonymousId,
    hashAnonymousId,
    resolveAnonymousSource
};
