const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;

  logger.error({
    message: err.message,
    status: statusCode,
    url: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Внутренняя ошибка сервера',
  });
};

module.exports = errorHandler;
