const express = require("express");
const { submitRegistration } = require("../controllers/registration.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", authenticate, submitRegistration);

module.exports = router;
