const path = require('path');
const express = require('express');
const { handleUploadError } = require('./middleware/upload.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// ... инициализация app, cors, json

// Раздача загруженных файлов
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ... маршруты
app.use('/api/admin', require('./routes/admin'));

// 404 и централизованный обработчик ошибок
app.use(notFoundHandler);
app.use(errorHandler);
