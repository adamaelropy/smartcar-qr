const express = require("express");
const router = express.Router();
const {
    getHealthCheck,
    testDatabaseConnection
} = require("../controllers/health.controller");

// Health check endpoint
router.get("/", getHealthCheck);

// Database connection test endpoint
router.get("/test-db", testDatabaseConnection);

module.exports = router;
