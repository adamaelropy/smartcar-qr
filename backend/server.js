const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


// ==============================
// Test Backend
// ==============================

app.get("/", (req, res) => {
    res.json({
        message: "SmartCar QR Backend is running!"
    });
});


// ==============================
// Test MySQL Connection
// ==============================

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS result");

        res.json({
            success: true,
            message: "MySQL connection successful!",
            database: process.env.DB_NAME,
            result: rows[0].result
        });

    } catch (error) {
        console.error("Database connection error:", error.message);

        res.status(500).json({
            success: false,
            message: "MySQL connection failed."
        });
    }
});


// ==============================
// Get Vehicle Using QR Token
// ==============================

app.get("/api/qr/:token", async (req, res) => {
    const { token } = req.params;

    try {
        const [rows] = await pool.query(
            `SELECT
                vehicle_id,
                user_id,
                plate_number,
                car_name,
                year_model
             FROM vehicles
             WHERE qr_token = ?`,
            [token]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "QR code not found."
            });
        }

        res.json({
            success: true,
            vehicle: rows[0]
        });

    } catch (error) {
        console.error("QR lookup error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve QR information."
        });
    }
});


// ==============================
// Get Vehicle QR Information
// ==============================

app.get("/api/vehicles/:vehicleId/qr", async (req, res) => {
    const { vehicleId } = req.params;

    try {
        const [rows] = await pool.query(
            `SELECT
                vehicle_id,
                user_id,
                plate_number,
                car_name,
                year_model,
                qr_token
             FROM vehicles
             WHERE vehicle_id = ?`,
            [vehicleId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found."
            });
        }

        res.json({
            success: true,
            vehicle: rows[0]
        });

    } catch (error) {
        console.error("Vehicle QR lookup error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve vehicle QR information."
        });
    }
});


// ==============================
// Start Server
// ==============================

app.listen(PORT, () => {
    console.log(
        `SmartCar QR Backend running on http://localhost:${PORT}`
    );
});