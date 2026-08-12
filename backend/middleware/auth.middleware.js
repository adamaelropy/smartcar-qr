const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    const token = authHeader.slice(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return res.status(500).json({
            success: false,
            message: "Server authentication is not configured."
        });
    }

    try {
        const payload = jwt.verify(token, secret);
        req.user = {
            userId: payload.userId,
            username: payload.username
        };
        next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired session."
        });
    }
}

module.exports = {
    authenticate
};
