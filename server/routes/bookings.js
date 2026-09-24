const router = require('express').Router();
const { Op } = require('sequelize');
const { Booking, Room } = require('../models');
const { authRequired } = require('../middleware/auth');

router.post('/', authRequired, async (req, res) => {
  const { room_id, check_in_date, check_out_date } = req.body;

  const today = new Date().toISOString().split('T')[0];
  if (check_in_date < today) return res.status(400).json({ error: 'Check-in in the past' });
  if (check_out_date <= check_in_date) return res.status(400).json({ error: 'Invalid dates' });

  const room = await Room.findByPk(room_id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const overlap = await Booking.findOne({
    where: {
      room_id,
      status: { [Op.ne]: 'rejected' },
      [Op.or]: [
        { check_in_date: { [Op.between]: [check_in_date, check_out_date] } },
        { check_out_date: { [Op.between]: [check_in_date, check_out_date] } }
      ]
    }
  });
  if (overlap) return res.status(409).json({ error: 'Room is busy' });

  const nights = Math.ceil((new Date(check_out_date) - new Date(check_in_date)) / 86400000);
  const total_price = nights * room.price_per_night;

  const booking = await Booking.create({
    user_id: req.user.user_id,
    room_id,
    check_in_date,
    check_out_date,
    total_price,
    status: 'pending'
  });
  res.status(201).json(booking);
});

router.get('/my', authRequired, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const { count, rows } = await Booking.findAndCountAll({
    where: { user_id: req.user.user_id },
    include: [{ model: Room }],
    order: [['created_at', 'DESC']],
    offset: (page - 1) * limit,
    limit
  });
  res.json({ total: count, page, limit, bookings: rows });
});

module.exports = router;