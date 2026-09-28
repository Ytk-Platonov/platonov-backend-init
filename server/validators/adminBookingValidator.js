const { query, validationResult } = require('express-validator');

// Middleware для обработки ошибок валидации
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            message: 'Ошибки валидации',
            errors: errors.array() 
        });
    }
    next(); // Если ошибок нет, идем дальше
};

exports.validateAdminBookings = [
    // Проверка статуса
    query('status')
        .optional() // Параметр не обязателен
        .isIn(['pending', 'confirmed', 'rejected'])
        .withMessage('Статус может быть только pending, confirmed или rejected'),
        
    // Проверка дат (формат ГГГГ-ММ-ДД)
    query('date_from')
        .optional()
        .isISO8601()
        .withMessage('date_from должен быть в формате YYYY-MM-DD'),
        
    query('date_to')
        .optional()
        .isISO8601()
        .withMessage('date_to должен быть в формате YYYY-MM-DD'),
        
    // Проверка пагинации
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page должен быть числом больше 0'),
        
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit должен быть от 1 до 100'),

    // Подключаем обработчик ошибок в конец цепочки
    handleValidationErrors
];
