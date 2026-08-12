const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

const PASSWORD_RULES = [
    {
        key: "length",
        test: (password) => password.length >= 6,
        message: "Password must be at least 6 characters."
    },
    {
        key: "uppercase",
        test: (password) => /[A-Z]/.test(password),
        message: "Password must contain at least 1 uppercase letter."
    },
    {
        key: "lowercase",
        test: (password) => /[a-z]/.test(password),
        message: "Password must contain at least 1 lowercase letter."
    },
    {
        key: "number",
        test: (password) => /[0-9]/.test(password),
        message: "Password must contain at least 1 number."
    },
    {
        key: "symbol",
        test: (password) => /[^A-Za-z0-9]/.test(password),
        message: "Password must contain at least 1 symbol."
    }
];

function validatePassword(password) {
    const errors = [];

    if (typeof password !== "string" || password.length === 0) {
        return ["Password is required."];
    }

    for (const rule of PASSWORD_RULES) {
        if (!rule.test(password)) {
            errors.push(rule.message);
        }
    }

    return errors;
}

async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

module.exports = {
    PASSWORD_RULES,
    validatePassword,
    hashPassword,
    comparePassword
};
