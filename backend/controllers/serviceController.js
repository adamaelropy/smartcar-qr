const prisma = require("../db");

const getServices = async (req, res) => {
    try {
        const services = await prisma.service.findMany({
            orderBy: {
                service_id: "asc"
            },
            select: {
                service_id: true,
                service_name: true,
                service_type: true,
                location: true,
                availability: true
            }
        });

        res.status(200).json({
            success: true,
            services
        });

    } catch (error) {
        console.error("Get services error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve services."
        });
    }
};

module.exports = {
    getServices
};