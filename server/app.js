const express = require('express');
const bookingsRouter = require('./routers/bookings.router');

const app = express();

app.use(express.json()); // Обязательно для парсинга JSON

// Подключаем роуты
app.use('/api/bookings', bookingsRouter);

// ... остальной код (запуск сервера, обработка ошибок и т.д.)

module.exports = app;
