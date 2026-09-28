const express = require('express');
const bookingController = require('../controllers/bookings.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/bookings
// 1. authMiddleware - проверяет токен
// 2. bookingController.create - выполняет логику
router.post('/', authMiddleware, bookingController.create);

module.exports = router;
