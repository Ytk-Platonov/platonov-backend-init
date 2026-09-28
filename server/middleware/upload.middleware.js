const multer = require('multer');

/**
 * Обработчик ошибок multer.
 * Возвращает единый формат ответа { success: false, error: { code, message } }.
 */
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    let message = 'Ошибка загрузки файла';
    let code = err.code;

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'Файл слишком большой. Максимальный размер — 5 МБ.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = err.field
          ? `Недопустимый формат файла (${err.field}). Разрешены: jpg, jpeg, png, webp.`
          : 'Неожиданное поле файла. Используйте ключ "image".';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Можно загрузить только один файл.';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Слишком много частей в запросе.';
        break;
      default:
        message = err.message || message;
    }

    return res.status(400).json({
      success: false,
      error: { code, message },
    });
  }

  if (err) {
    // Прочие ошибки — передаём дальше в централизованный обработчик
    return next(err);
  }
  next();
}

module.exports = { handleUploadError };
