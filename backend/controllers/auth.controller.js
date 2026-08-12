const prisma = require("../db");

const {
    validateSignupInput,
    validateLoginInput
} = require("../validators/auth.validator");

const { hashPassword, comparePassword } = require("../utils/password");
const { buildSignupPlaceholders } = require("../utils/userDefaults");
const { signToken } = require("../utils/jwt");
const { isRegistrationComplete } = require("../utils/registrationStatus");

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

module.exports = {
    signup,
    login
};