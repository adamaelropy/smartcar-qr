const prisma = require("../db");

async function getHealthCheck(req, res) {
    res.json({
        message: "SmartCar QR Backend is running!"
    });
}

async function testDatabaseConnection(req, res) {
    try {
        const result = await prisma.$queryRaw`SELECT 1 AS result`;

        res.json({
            success: true,
            message: "Supabase PostgreSQL connection successful!",
            result: Number(result[0].result)
        });

    } catch (error) {
        console.error("Database connection error:", error.message);

        res.status(500).json({
            success: false,
            message: "Supabase PostgreSQL connection failed."
        });
    }
}

module.exports = {
    getHealthCheck,
    testDatabaseConnection
};
