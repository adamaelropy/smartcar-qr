function buildSignupPlaceholders(username) {
    return {
        name: username,
        age: 0,
        phone: "PENDING",
        email: `${username}@pending.smartcar.local`
    };
}

module.exports = {
    buildSignupPlaceholders
};
