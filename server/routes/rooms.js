const router = require('express').Router();
const { Op } = require('sequelize');
const { Room } = require('../models');

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  if (isNaN(page) || isNaN(limit)) return res.status(400).json({ error: 'Invalid pagination' });

  const { count, rows } = await Room.findAndCountAll({
    where: { is_available: true },
    offset: (page - 1) * limit,
    limit
  });
  res.json({ total: count, page, limit, rooms: rows });
});

router.get('/filter', async (req, res) => {
  const { category, minPrice, maxPrice, capacity, check_in, check_out } = req.query;
  const where = { is_available: true };

  if (category) where.category = category;
  if (minPrice || maxPrice) {
    where.price_per_night = {};
    if (minPrice) where.price_per_night[Op.gte] = +minPrice;
    if (maxPrice) where.price_per_night[Op.lte] = +maxPrice;
  }
  if (capacity) where.capacity = { [Op.gte]: +capacity };

  if (check_in && isNaN(Date.parse(check_in))) return res.status(400).json({ error: 'Invalid date' });
  if (check_out && isNaN(Date.parse(check_out))) return res.status(400).json({ error: 'Invalid date' });

  const rooms = await Room.findAll({ where });
  res.json({ count: rooms.length, rooms });
});

router.get('/:id', async (req, res) => {
  if (isNaN(+req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const room = await Room.findByPk(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

module.exports = router;