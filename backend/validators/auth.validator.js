const { validatePassword } = require("../utils/password");

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 50;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

function validateAccountFields({ username, password, confirmPassword }) {
    const errors = [];

    if (typeof username !== "string" || username.trim().length === 0) {
        errors.push("Username is required.");
    } else {
        const trimmedUsername = username.trim();

        if (trimmedUsername.length < USERNAME_MIN_LENGTH) {
            errors.push(`Username must be at least ${USERNAME_MIN_LENGTH} characters.`);
        }

        if (trimmedUsername.length > USERNAME_MAX_LENGTH) {
            errors.push(`Username must be at most ${USERNAME_MAX_LENGTH} characters.`);
        }

        if (!USERNAME_PATTERN.test(trimmedUsername)) {
            errors.push("Username may only contain letters, numbers, and underscores.");
        }
    }

    errors.push(...validatePassword(password));

    if (typeof confirmPassword !== "string" || confirmPassword.length === 0) {
        errors.push("Password confirmation is required.");
    } else if (password !== confirmPassword) {
        errors.push("Password confirmation does not match.");
    }

    return errors;
}

function validateSignupInput(body) {
    return validateAccountFields(body);
}

function validateLoginInput({ username, password }) {
    const errors = [];

    if (typeof username !== "string" || username.trim().length === 0) {
        errors.push("Username is required.");
    }

    if (typeof password !== "string" || password.length === 0) {
        errors.push("Password is required.");
    }

    return errors;
}

module.exports = {
    validateSignupInput,
    validateLoginInput
};
