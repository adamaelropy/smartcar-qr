const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const authRoutes = require("./routes/auth.routes");
const registrationRoutes = require("./routes/registration.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/registration", registrationRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "SmartCar QR Backend is running!"
    });
});

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

app.listen(PORT, () => {
    console.log(`SmartCar QR Backend running on http://localhost:${PORT}`);
});