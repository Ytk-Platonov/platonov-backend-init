const roomsRouter = require('./routes/rooms');
app.use('/api/rooms', roomsRouter);
=======
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
=======
const express = require('express');
const bookingsRouter = require('./routers/bookings.router');

const app = express();

app.use(express.json()); // Обязательно для парсинга JSON

// Подключаем роуты
app.use('/api/bookings', bookingsRouter);

// ... остальной код (запуск сервера, обработка ошибок и т.д.)
=======
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка CORS
app.use(cors());

// Middleware для парсинга JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование HTTP-запросов в консоль
app.use(morgan('dev'));

// Обработчик 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Маршрут не найден' });
});

// Глобальный обработчик ошибок (всегда в самом конце)
app.use(errorHandler);

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

module.exports = app;