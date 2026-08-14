const prisma = require("../db");

const {
    validateRegistrationDetails
} = require("../validators/registration.validator");

const {
    isRegistrationComplete
} = require("../utils/registrationStatus");

const {
    generateQrToken
} = require("../utils/qrToken");

async function submitRegistration(req, res) {
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

        // Check whether another user is already using this email
        const existingEmail = await prisma.user.findFirst({
            where: {
                email: trimmedEmail,
                NOT: {
                    user_id: userId
                }
            },
            select: {
                user_id: true
            }
        });

        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "Email is already in use."
            });
        }

        const qrToken = generateQrToken();

        /*
         * Create all registration data inside one transaction.
         *
         * If any operation fails, Prisma automatically rolls
         * everything back.
         */
        await prisma.$transaction(async (tx) => {

            // Update user profile
            await tx.user.update({
                where: {
                    user_id: userId
                },
                data: {
                    name: trimmedName,
                    age: numericAge,
                    phone: trimmedPhone,
                    email: trimmedEmail
                }
            });

            // Create emergency contact
            await tx.emergencyContact.create({
                data: {
                    user_id: userId,
                    relative_name: trimmedRelativeName,
                    relative_phone: trimmedRelativePhone,
                    relationship: trimmedRelationship || null
                }
            });

            // Create vehicle and QR token
            await tx.vehicle.create({
                data: {
                    user_id: userId,
                    plate_number: trimmedPlateNumber,
                    car_name: trimmedCarName,
                    year_model: numericYearModel,
                    qr_token: qrToken
                }
            });
        });

        return res.status(201).json({
            success: true,
            message: "Registration completed successfully.",

            profile: {
                user_id: userId,
                name: trimmedName,
                age: numericAge,
                phone: trimmedPhone,
                email: trimmedEmail
            },

            emergencyContact: {
                relative_name: trimmedRelativeName,
                relative_phone: trimmedRelativePhone,
                relationship: trimmedRelationship || null
            },

            vehicle: {
                plate_number: trimmedPlateNumber,
                car_name: trimmedCarName,
                year_model: numericYearModel,
                qr_token: qrToken
            }
        });

    } catch (error) {
        console.error("Registration error:", error.message);

        const response = {
            success: false,
            message: "Unable to complete registration. Please try again later."
        };

        if (process.env.NODE_ENV !== "production") {
            response.error = error.message;
        }

        return res.status(500).json(response);
    }
}

module.exports = {
    submitRegistration
};