const prisma = require("../db");

async function isRegistrationComplete(userId) {
    const vehicle = await prisma.vehicle.findUnique({
        where: {
            user_id: userId
        },
        select: {
            vehicle_id: true
        }
    });

    return vehicle !== null;
}

module.exports = {
    isRegistrationComplete
};