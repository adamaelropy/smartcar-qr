const pool = require("../db");

async function isRegistrationComplete(userId) {
    const [vehicles] = await pool.query(
        "SELECT vehicle_id FROM vehicles WHERE user_id = ? LIMIT 1",
        [userId]
    );

    return vehicles.length > 0;
}

module.exports = {
    isRegistrationComplete
};
