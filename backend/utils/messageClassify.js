function classifyMessageText(text) {
    const normalized = String(text || "").toLowerCase();
    if (normalized.includes("accident") || normalized.includes("emergency")) return "emergency";
    if (normalized.includes("block") || normalized.includes("blocked") || normalized.includes("blocking")) return "blocked";
    return "message";
}

function formatTime(value) {
    return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

module.exports = {
    classifyMessageText,
    formatTime
};
