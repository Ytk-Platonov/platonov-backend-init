const express = require('express');
const router = express.Router();
const { getRoomById } = require('../controllers/roomsController');

// GET /api/rooms/:id
router.get('/:id', getRoomById);

module.exports = router;
