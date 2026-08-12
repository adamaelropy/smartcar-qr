const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[a-zA-Z\s'-]{2,100}$/;
const PHONE_PATTERN = /^[\d\s+\-()]{7,20}$/;
const PLATE_PATTERN = /^[a-zA-Z0-9\s-]{2,20}$/;

const MIN_AGE = 16;
const MAX_AGE = 120;
const MIN_YEAR = 1980;
const MAX_YEAR = new Date().getFullYear() + 1;

function validateRegistrationDetails({
    fullName,
    age,
    email,
    phone,
    relativeName,
    relativePhone,
    relationship,
    plateNumber,
    carName,
    yearModel
}) {
    const errors = [];

    if (typeof fullName !== "string" || fullName.trim().length === 0) {
        errors.push("Full name is required.");
    } else if (!NAME_PATTERN.test(fullName.trim())) {
        errors.push("Full name must be 2–100 letters and may include spaces, hyphens, or apostrophes.");
    }

    const parsedAge = Number(age);
    if (age === undefined || age === null || age === "") {
        errors.push("Age is required.");
    } else if (!Number.isInteger(parsedAge) || parsedAge < MIN_AGE || parsedAge > MAX_AGE) {
        errors.push(`Age must be a whole number between ${MIN_AGE} and ${MAX_AGE}.`);
    }

    if (typeof email !== "string" || email.trim().length === 0) {
        errors.push("Email is required.");
    } else if (!EMAIL_PATTERN.test(email.trim())) {
        errors.push("Email format is invalid.");
    }

    if (typeof phone !== "string" || phone.trim().length === 0) {
        errors.push("Phone number is required.");
    } else if (!PHONE_PATTERN.test(phone.trim())) {
        errors.push("Phone number format is invalid.");
    }

    if (typeof relativeName !== "string" || relativeName.trim().length === 0) {
        errors.push("Emergency contact name is required.");
    } else if (!NAME_PATTERN.test(relativeName.trim())) {
        errors.push("Emergency contact name format is invalid.");
    }

    if (typeof relativePhone !== "string" || relativePhone.trim().length === 0) {
        errors.push("Emergency contact phone is required.");
    } else if (!PHONE_PATTERN.test(relativePhone.trim())) {
        errors.push("Emergency contact phone format is invalid.");
    }

    if (typeof relationship !== "string" || relationship.trim().length === 0) {
        errors.push("Relationship to emergency contact is required.");
    } else if (relationship.trim().length > 100) {
        errors.push("Relationship must be at most 100 characters.");
    }

    if (typeof plateNumber !== "string" || plateNumber.trim().length === 0) {
        errors.push("Plate number is required.");
    } else if (!PLATE_PATTERN.test(plateNumber.trim())) {
        errors.push("Plate number format is invalid.");
    }

    if (typeof carName !== "string" || carName.trim().length === 0) {
        errors.push("Car name is required.");
    } else if (carName.trim().length > 100) {
        errors.push("Car name must be at most 100 characters.");
    }

    const parsedYear = Number(yearModel);
    if (yearModel === undefined || yearModel === null || yearModel === "") {
        errors.push("Year model is required.");
    } else if (!Number.isInteger(parsedYear) || parsedYear < MIN_YEAR || parsedYear > MAX_YEAR) {
        errors.push(`Year model must be between ${MIN_YEAR} and ${MAX_YEAR}.`);
    }

    return errors;
}

module.exports = {
    validateRegistrationDetails
};
