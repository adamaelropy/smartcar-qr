const express = require('express');
const { listUsers } = require('../controllers/users.controller');

const router = express.Router();

// Public for development: return users with minimal fields and vehicle QR token
router.get('/', listUsers);

module.exports = router;
