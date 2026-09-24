const router = require('express').Router();
const { Booking } = require('../models');
const { authRequired, adminOnly } = require('../middleware/auth');

router.use(authRequired, adminOnly);

router.get('/bookings', async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;

  const bookings = await Booking.findAll({ where });
  res.json({ bookings });
});

router.patch('/bookings/:id/confirm', async (req, res) => {
  const booking = await Booking.findByPk(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Not found' });
  if (booking.status !== 'pending') return res.status(400).json({ error: 'Not pending' });

  booking.status = 'confirmed';
  await booking.save();
  res.json(booking);
});

router.patch('/bookings/:id/reject', async (req, res) => {
  const booking = await Booking.findByPk(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Not found' });
  if (booking.status !== 'pending') return res.status(400).json({ error: 'Not pending' });

  booking.status = 'rejected';
  await booking.save();
  res.json(booking);
});

module.exports = router;