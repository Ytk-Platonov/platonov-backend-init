const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(cors({ origin: '*' })); // потом заменишь на URL фронта
app.use(express.json());

// Health-check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

module.exports = app;