const express = require("express");
const {
    signup,
    login,
    getMe,
    updateMe,
    changePassword
} = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.put("/me", authenticate, updateMe);
router.put("/password", authenticate, changePassword);

module.exports = router;
