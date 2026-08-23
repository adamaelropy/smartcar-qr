const jwt = require("jsonwebtoken");

function signToken(user) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not configured.");
    }

    return jwt.sign(
        {
            userId: user.user_id,
            username: user.username
        },
        secret
        
        
    );
}

module.exports = {
    signToken
};
