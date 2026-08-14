const { validatePassword } = require("../utils/password");
const { validateRegistrationDetails } = require("./registration.validator");

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 50;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

function validateUsername(username) {
    const errors = [];

    if (typeof username !== "string" || username.trim().length === 0) {
        errors.push("Username is required.");
        return errors;
    }

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

    return errors;
}

function validateProfileUpdate(body) {
    return [
        ...validateUsername(body.username),
        ...validateRegistrationDetails({
            fullName: body.fullName,
            age: body.age,
            email: body.email,
            phone: body.phone,
            relativeName: body.relativeName,
            relativePhone: body.relativePhone,
            relationship: body.relationship,
            plateNumber: body.plateNumber,
            carName: body.carName,
            yearModel: body.yearModel
        })
    ];
}

function validateChangePassword({ currentPassword, newPassword, confirmPassword }) {
    const errors = [];

    if (typeof currentPassword !== "string" || currentPassword.length === 0) {
        errors.push("Current password is required.");
    }

    errors.push(...validatePassword(newPassword));

    if (typeof confirmPassword !== "string" || confirmPassword.length === 0) {
        errors.push("Password confirmation is required.");
    } else if (newPassword !== confirmPassword) {
        errors.push("Password confirmation does not match.");
    }

    if (
        typeof currentPassword === "string" &&
        currentPassword.length > 0 &&
        typeof newPassword === "string" &&
        newPassword.length > 0 &&
        currentPassword === newPassword
    ) {
        errors.push("New password must be different from the current password.");
    }

    return errors;
}

module.exports = {
    validateProfileUpdate,
    validateChangePassword
};
