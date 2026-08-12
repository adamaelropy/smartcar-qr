const express = require("express");

const {
    getServices,
    searchServices,
    filterServices
} = require("../controllers/serviceController");

const router = express.Router();

router.get("/", getServices);

router.get("/search", searchServices);

router.get("/filter", filterServices);

module.exports = router;