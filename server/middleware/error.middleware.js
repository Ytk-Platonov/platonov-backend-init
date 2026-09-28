/**
 * Централизованный middleware обработки ошибок.
 * Формат ответа: { success: false, error: { code, message } }.
 */
function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Внутренняя ошибка сервера',
    },
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Маршрут ${req.method} ${req.originalUrl} не найден` },
  });
}

module.exports = { errorHandler, notFoundHandler };
