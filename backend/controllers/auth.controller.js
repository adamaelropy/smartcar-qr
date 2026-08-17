const prisma = require("../db");

const {
    validateSignupInput,
    validateLoginInput
} = require("../validators/auth.validator");

const {
    validateProfileUpdate,
    validateChangePassword
} = require("../validators/profile.validator");

const { hashPassword, comparePassword } = require("../utils/password");
const { buildSignupPlaceholders } = require("../utils/userDefaults");
const { signToken } = require("../utils/jwt");
const { isRegistrationComplete } = require("../utils/registrationStatus");
const { generateQrToken } = require("../utils/qrToken");

async function signup(req, res) {
    try {
        const { username, password, confirmPassword } = req.body;

        const validationErrors = validateSignupInput({
            username,
            password,
            confirmPassword
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: validationErrors
            });
        }

        const trimmedUsername = username.trim();

        // Check whether username already exists
        const existingUser = await prisma.user.findUnique({
            where: {
                username: trimmedUsername
            },
            select: {
                user_id: true
            }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Username is already taken."
            });
        }

        const passwordHash = await hashPassword(password);
        const placeholders = buildSignupPlaceholders(trimmedUsername);

        // Create user
        const createdUser = await prisma.user.create({
            data: {
                username: trimmedUsername,
                password_hash: passwordHash,
                name: placeholders.name,
                age: placeholders.age,
                phone: placeholders.phone,
                email: placeholders.email
            },
            select: {
                user_id: true,
                username: true
            }
        });

        const token = signToken(createdUser);

        const user = {
            user_id: createdUser.user_id,
            username: createdUser.username
        };

        return res.status(201).json({
            success: true,
            message: "Account created successfully.",
            token,
            user,
            registrationComplete: false
        });

    } catch (error) {
        console.error("Signup error:", error.message);

        const response = {
            success: false,
            message: "Unable to create account. Please try again later."
        };

        if (process.env.NODE_ENV !== "production") {
            response.error = error.message;
        }

        return res.status(500).json(response);
    }
}

async function login(req, res) {
    try {
        const { username, password } = req.body;

        const validationErrors = validateLoginInput({
            username,
            password
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: validationErrors
            });
        }

        const trimmedUsername = username.trim();

        // Find user
        const user = await prisma.user.findUnique({
            where: {
                username: trimmedUsername
            },
            select: {
                user_id: true,
                username: true,
                password_hash: true
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        const passwordMatches = await comparePassword(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password."
            });
        }

        const registrationComplete = await isRegistrationComplete(
            user.user_id
        );

        const token = signToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                user_id: user.user_id,
                username: user.username
            },
            registrationComplete
        });

    } catch (error) {
        console.error("Login error:", error.message);

        const response = {
            success: false,
            message: "Unable to log in. Please try again later."
        };

        if (process.env.NODE_ENV !== "production") {
            response.error = error.message;
        }

        return res.status(500).json(response);
    }
}

async function getMe(req, res) {
    try {
        const userId = req.user.userId;

        const user = await prisma.user.findUnique({
            where: {
                user_id: userId
            },
            select: {
                user_id: true,
                username: true,
                name: true,
                age: true,
                phone: true,
                email: true,
                emergencyContacts: {
                    select: {
                        contact_id: true,
                        relative_name: true,
                        relative_phone: true,
                        relationship: true
                    },
                    orderBy: {
                        contact_id: "desc"
                    },
                    take: 1
                },
                vehicle: {
                    select: {
                        vehicle_id: true,
                        plate_number: true,
                        car_name: true,
                        year_model: true,
                        qr_token: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                user_id: user.user_id,
                username: user.username,
                name: user.name,
                age: user.age,
                phone: user.phone,
                email: user.email
            },
            emergencyContact: user.emergencyContacts[0] || null,
            vehicle: user.vehicle || null
        });
    } catch (error) {
        console.error("Get current user error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve profile information."
        });
    }
}

function formatProfileResponse(user) {
    return {
        success: true,
        user: {
            user_id: user.user_id,
            username: user.username,
            name: user.name,
            age: user.age,
            phone: user.phone,
            email: user.email
        },
        emergencyContact: user.emergencyContacts[0] || null,
        vehicle: user.vehicle || null
    };
}

async function updateMe(req, res) {
    const userId = req.user.userId;

    try {
        const {
            fullName,
            username,
            age,
            email,
            phone,
            relativeName,
            relativePhone,
            relationship,
            plateNumber,
            carName,
            yearModel
        } = req.body;

        const validationErrors = validateProfileUpdate(req.body);

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: validationErrors
            });
        }

        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedName = fullName.trim();
        const trimmedPhone = phone.trim();
        const trimmedRelativeName = relativeName.trim();
        const trimmedRelativePhone = relativePhone.trim();
        const trimmedRelationship = typeof relationship === "string"
            ? relationship.trim()
            : null;
        const trimmedPlateNumber = plateNumber.trim();
        const trimmedCarName = carName.trim();
        const numericAge = Number(age);
        const numericYearModel = Number(yearModel);

        const existingUsername = await prisma.user.findFirst({
            where: {
                username: trimmedUsername,
                NOT: { user_id: userId }
            },
            select: { user_id: true }
        });

        if (existingUsername) {
            return res.status(409).json({
                success: false,
                message: "Username is already taken."
            });
        }

        const existingEmail = await prisma.user.findFirst({
            where: {
                email: trimmedEmail,
                NOT: { user_id: userId }
            },
            select: { user_id: true }
        });

        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "Email is already in use."
            });
        }

        const existingPlate = await prisma.vehicle.findFirst({
            where: {
                plate_number: trimmedPlateNumber,
                NOT: { user_id: userId }
            },
            select: { vehicle_id: true }
        });

        if (existingPlate) {
            return res.status(409).json({
                success: false,
                message: "Plate number is already registered."
            });
        }

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { user_id: userId },
                data: {
                    username: trimmedUsername,
                    name: trimmedName,
                    age: numericAge,
                    phone: trimmedPhone,
                    email: trimmedEmail
                }
            });

            const existingContact = await tx.emergencyContact.findFirst({
                where: { user_id: userId },
                orderBy: { contact_id: "desc" },
                select: { contact_id: true }
            });

            if (existingContact) {
                await tx.emergencyContact.update({
                    where: { contact_id: existingContact.contact_id },
                    data: {
                        relative_name: trimmedRelativeName,
                        relative_phone: trimmedRelativePhone,
                        relationship: trimmedRelationship || null
                    }
                });
            } else {
                await tx.emergencyContact.create({
                    data: {
                        user_id: userId,
                        relative_name: trimmedRelativeName,
                        relative_phone: trimmedRelativePhone,
                        relationship: trimmedRelationship || null
                    }
                });
            }

            const existingVehicle = await tx.vehicle.findUnique({
                where: { user_id: userId },
                select: { vehicle_id: true }
            });

            if (existingVehicle) {
                await tx.vehicle.update({
                    where: { vehicle_id: existingVehicle.vehicle_id },
                    data: {
                        plate_number: trimmedPlateNumber,
                        car_name: trimmedCarName,
                        year_model: numericYearModel
                    }
                });
            } else {
                await tx.vehicle.create({
                    data: {
                        user_id: userId,
                        plate_number: trimmedPlateNumber,
                        car_name: trimmedCarName,
                        year_model: numericYearModel,
                        qr_token: generateQrToken()
                    }
                });
            }
        });

        const updatedUser = await prisma.user.findUnique({
            where: { user_id: userId },
            select: {
                user_id: true,
                username: true,
                name: true,
                age: true,
                phone: true,
                email: true,
                emergencyContacts: {
                    select: {
                        contact_id: true,
                        relative_name: true,
                        relative_phone: true,
                        relationship: true
                    },
                    orderBy: { contact_id: "desc" },
                    take: 1
                },
                vehicle: {
                    select: {
                        vehicle_id: true,
                        plate_number: true,
                        car_name: true,
                        year_model: true,
                        qr_token: true
                    }
                }
            }
        });

        return res.status(200).json({
            ...formatProfileResponse(updatedUser),
            message: "Profile updated successfully."
        });
    } catch (error) {
        console.error("Update profile error:", error.message);

        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "A profile field value is already in use."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update profile. Please try again later."
        });
    }
}

async function changePassword(req, res) {
    const userId = req.user.userId;

    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        const validationErrors = validateChangePassword({
            currentPassword,
            newPassword,
            confirmPassword
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: validationErrors
            });
        }

        const user = await prisma.user.findUnique({
            where: { user_id: userId },
            select: {
                user_id: true,
                password_hash: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const passwordMatches = await comparePassword(
            currentPassword,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        const passwordHash = await hashPassword(newPassword);

        await prisma.user.update({
            where: { user_id: userId },
            data: { password_hash: passwordHash }
        });

        return res.status(200).json({
            success: true,
            message: "Password changed successfully."
        });
    } catch (error) {
        console.error("Change password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to change password. Please try again later."
        });
    }
}

module.exports = {
    signup,
    login,
    getMe,
    updateMe,
    changePassword
};