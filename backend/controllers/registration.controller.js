const crypto = require("crypto");
const pool = require("../db");
const { validateRegistrationDetails } = require("../validators/registration.validator");
const { isRegistrationComplete } = require("../utils/registrationStatus");

function generateQrToken() {
    return crypto.randomBytes(32).toString("hex");
}

async function submitRegistration(req, res) {
    const connection = await pool.getConnection();
    const userId = req.user.userId;

    try {
        const {
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
        } = req.body;

        const validationErrors = validateRegistrationDetails(req.body);

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: validationErrors
            });
        }

        const alreadyRegistered = await isRegistrationComplete(userId);

        if (alreadyRegistered) {
            return res.status(409).json({
                success: false,
                message: "Registration is already complete."
            });
        }

        const trimmedEmail = email.trim().toLowerCase();

        const [existingEmails] = await connection.query(
            "SELECT user_id FROM users WHERE email = ? AND user_id != ?",
            [trimmedEmail, userId]
        );

        if (existingEmails.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email is already in use."
            });
        }

        const qrToken = generateQrToken();

        await connection.beginTransaction();

        await connection.query(
            `UPDATE users
             SET name = ?, age = ?, phone = ?, email = ?
             WHERE user_id = ?`,
            [fullName.trim(), Number(age), phone.trim(), trimmedEmail, userId]
        );

        await connection.query(
            `INSERT INTO emergency_contacts (user_id, relative_name, relative_phone)
             VALUES (?, ?, ?)`,
            [userId, relativeName.trim(), relativePhone.trim()]
        );

        await connection.query(
            `INSERT INTO vehicles (user_id, plate_number, car_name, year_model, qr_token)
             VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                plateNumber.trim(),
                carName.trim(),
                Number(yearModel),
                qrToken
            ]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Registration completed successfully.",
            profile: {
                user_id: userId,
                name: fullName.trim(),
                age: Number(age),
                phone: phone.trim(),
                email: trimmedEmail
            },
            emergencyContact: {
                relative_name: relativeName.trim(),
                relative_phone: relativePhone.trim(),
                relationship: relationship.trim()
            },
            vehicle: {
                plate_number: plateNumber.trim(),
                car_name: carName.trim(),
                year_model: Number(yearModel),
                qr_token: qrToken
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error("Registration error:", error.message);

        const response = {
            success: false,
            message: "Unable to complete registration. Please try again later."
        };

        if (process.env.NODE_ENV !== "production") {
            response.error = error.message;
        }

        return res.status(500).json(response);
    } finally {
        connection.release();
    }
}

module.exports = {
    submitRegistration
};
