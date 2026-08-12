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


const searchServices = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Search query is required."
            });
        }

        const searchTerm = query.trim();

        const services = await prisma.service.findMany({
            where: {
                OR: [
                    {
                        service_name: {
                            contains: searchTerm,
                            mode: "insensitive"
                        }
                    },
                    {
                        location: {
                            contains: searchTerm,
                            mode: "insensitive"
                        }
                    }
                ]
            },
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
        console.error("Search services error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to search services."
        });
    }
};


const filterServices = async (req, res) => {
    try {
        const { type, availability } = req.query;

        const where = {};

        if (type) {
            where.service_type = type;
        }

        if (availability !== undefined) {
            where.availability =
                availability === "true" || availability === "1";
        }

        const services = await prisma.service.findMany({
            where,
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
        console.error("Filter services error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to filter services."
        });
    }
};


module.exports = {
    getServices,
    searchServices,
    filterServices
};