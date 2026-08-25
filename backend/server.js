const express = require("express");
const cors = require("cors");
require("dotenv").config();

const prisma = require("./db");
const serviceRoutes = require("./routes/serviceRoutes");
const authRoutes = require("./routes/auth.routes");
const registrationRoutes = require("./routes/registration.routes");
const messagesRoutes = require("./routes/messages.routes");
const usersRoutes = require("./routes/users.routes");
const vehiclesRoutes = require("./routes/vehicles.routes");
const qrRoutes = require("./routes/qr.routes");

const app = express();
app.disable("etag");

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "SmartCar QR Backend is running!" });
});

app.get("/api/test-db", async (req, res) => {
    try {
        const result = await prisma.$queryRaw`SELECT 1 AS result`;
        res.json({ success: true, message: "Supabase PostgreSQL connection successful!", result: Number(result[0].result) });
    } catch (error) {
        console.error("Database connection error:", error.message);
        res.status(500).json({ success: false, message: "Supabase PostgreSQL connection failed." });
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/registration", registrationRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/vehicles", vehiclesRoutes);
app.use("/api/qr", qrRoutes);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`SmartCar QR Backend running on http://localhost:${PORT}`);
    });
}

module.exports = app;
