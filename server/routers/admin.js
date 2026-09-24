const express = require('express');
const router = express.Router();

// Импорты (пока ставим заглушки, если файлов еще нет)
const adminController = require('../controllers/adminBookingController');

// Заглушки для middleware от Надеждина (18). 
// Когда он допишет свой код, он просто заменит эти строки своими реальными функциями.
const { verifyToken, checkRole } = require('../middleware/auth'); 

// Заглушка для валидатора (твой файл ниже)
const { validateAdminBookings } = require('../validators/adminBookingValidator');

// GET /api/admin/bookings
router.get(
    '/bookings', 
    verifyToken,               // 1. Проверка токена (от Надеждина)
    checkRole('admin'),        // 2. Проверка, что это админ (от Надеждина)
    validateAdminBookings,     // 3. Проверка параметров (твоя)
    adminController.getAllBookings // 4. Твоя главная логика
);

module.exports = router;
