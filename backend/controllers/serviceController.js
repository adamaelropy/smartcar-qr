const pool = require("../db");

const getServices = async (req, res) => {
    try {
        const [services] = await pool.query(`
            SELECT
                service_id,
                service_name,
                service_type,
                location,
                availability
            FROM services
            ORDER BY service_id ASC
        `);

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

        const searchTerm = `%${query.trim()}%`;

        const [services] = await pool.query(
            `
            SELECT
                service_id,
                service_name,
                service_type,
                location,
                availability
            FROM services
            WHERE service_name LIKE ?
               OR service_type LIKE ?
               OR location LIKE ?
            ORDER BY service_id ASC
            `,
            [searchTerm, searchTerm, searchTerm]
        );

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

        let query = `
            SELECT
                service_id,
                service_name,
                service_type,
                location,
                availability
            FROM services
            WHERE 1 = 1
        `;

        const params = [];

        if (type) {
            query += " AND service_type = ?";
            params.push(type);
        }

        if (availability !== undefined) {
            query += " AND availability = ?";
            params.push(
                availability === "true" || availability === "1" ? 1 : 0
            );
        }

        query += " ORDER BY service_id ASC";

        const [services] = await pool.query(query, params);

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