/**
 * Единый файл приложения:
 * - Централизованная валидация (express-validator)
 * - Защита от XSS (санитизация входа)
 * - Защита от SQL-инъекций (параметризация ORM / whitelist)
 * - Rate limiting (по IP)
 * - Централизованный обработчик ошибок (единый формат)
 */

'use strict';

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss');

// ============================================================
// 1. Конфигурация приложения
// ============================================================

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(helmet());                          // базовые security-заголовки
app.use(express.json({ limit: '10kb' }));   // ограничение размера тела

// ============================================================
// 2. Кастомные классы ошибок (централизованный формат)
// ============================================================

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Ошибка валидации', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Ресурс не найден') {
    super(message, 404, 'NOT_FOUND');
  }
}

// ============================================================
// 3. Утилита-обёртка для асинхронных обработчиков
// ============================================================

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ============================================================
// 4. Middleware санитизации от XSS
// ============================================================

// Рекурсивно очищает все строковые значения в объекте
const sanitizeDeep = (value) => {
  if (typeof value === 'string') return xss(value, { whiteList: {}, stripIgnoreTag: true });
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitizeDeep(v)])
    );
  }
  return value;
};

const sanitizeInput = (req, _res, next) => {
  if (req.body) req.body = sanitizeDeep(req.body);
  if (req.query) req.query = sanitizeDeep(req.query);
  if (req.params) req.params = sanitizeDeep(req.params);
  next();
};

app.use(sanitizeInput);

// ============================================================
// 5. Rate limiting по IP
// ============================================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 минут
  max: 100,                    // 100 запросов на IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Слишком много запросов, попробуйте позже' },
  },
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Превышено количество попыток входа' },
  },
});

app.use('/api/', apiLimiter);

// ============================================================
// 6. Централизованные схемы валидации (express-validator)
// ============================================================

// 6.1. Email
const emailSchema = body('email')
  .trim()
  .notEmpty().withMessage('Email обязателен')
  .isEmail().withMessage('Некорректный формат email')
  .normalizeEmail()
  .isLength({ max: 255 }).withMessage('Email слишком длинный');

// 6.2. Телефон: +7(XXX)-XXX-XX-XX
const phoneSchema = body('phone')
  .trim()
  .notEmpty().withMessage('Телефон обязателен')
  .matches(/^\+7\(\d{3}\)-\d{3}-\d{2}-\d{2}$/)
  .withMessage('Телефон должен быть в формате +7(XXX)-XXX-XX-XX');

// 6.3. Даты (ISO 8601 + логика)
const dateSchema = (field, { required = true, before = null } = {}) => {
  let chain = required
    ? body(field).notEmpty().withMessage(`Поле ${field} обязательно`)
    : body(field).optional({ checkFalsy: true });

  chain = chain
    .isISO8601().withMessage(`${field} должен быть в формате ISO 8601 (YYYY-MM-DD)`)
    .toDate();

  if (before) {
    chain = chain.isBefore(before).withMessage(`${field} должен быть раньше ${before}`);
  }
  return chain;
};

// 6.4. Числовые поля
const priceSchema = (field = 'price') =>
  body(field)
    .notEmpty().withMessage('Цена обязательна')
    .isFloat({ min: 0.01, max: 9_999_999.99 })
    .withMessage('Цена должна быть числом от 0.01 до 9999999.99')
    .toFloat();

const capacitySchema = (field = 'capacity') =>
  body(field)
    .notEmpty().withMessage('Вместимость обязательна')
    .isInt({ min: 1, max: 10_000 })
    .withMessage('Вместимость должна быть целым числом от 1 до 10000')
    .toInt();

// 6.5. Композитные схемы для маршрутов
const createUserSchema = [
  emailSchema,
  phoneSchema,
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Имя должно содержать от 2 до 100 символов'),
];

const updateBookingSchema = [
  param('id').isInt({ min: 1 }).withMessage('Некорректный ID').toInt(),
  dateSchema('checkIn', { before: '2030-01-01' }),
  dateSchema('checkOut'),
  capacitySchema('capacity'),
  priceSchema('price').optional({ checkFalsy: true }),
];

// ============================================================
// 7. Middleware проверки результатов валидации
// ============================================================

const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
      value: e.value,
    }));
    return next(new ValidationError('Ошибка валидации входных данных', details));
  }
  next();
};

// ============================================================
// 8. Слой доступа к данным (демонстрация защиты от SQL-инъекций)
// ============================================================

// Whitelist разрешённых колонок для сортировки — защита от инъекций через ORDER BY
const ALLOWED_SORT_COLUMNS = new Set(['id', 'email', 'name', 'created_at']);
const ALLOWED_ORDER = new Set(['ASC', 'DESC']);

const safeOrderBy = (column, order) => ({
  column: ALLOWED_SORT_COLUMNS.has(column) ? column : 'id',
  order: ALLOWED_ORDER.has(String(order || '').toUpperCase())
    ? String(order).toUpperCase()
    : 'ASC',
});

/**
 * Имитация ORM-слоя. В реальном проекте здесь был бы Sequelize/TypeORM/Prisma,
 * где параметризация выполняется автоматически.
 *
 * ВАЖНО: никогда не конкатенируйте пользовательский ввод в SQL.
 *   ПЛОХО:  `SELECT * FROM users WHERE email = '${email}'`
 *   ХОРОШО: db.query('SELECT * FROM users WHERE email = $1', [email])
 */
const db = {
  users: [],

  async createUser({ email, phone, name }) {
    // Имитация параметризованного INSERT
    const user = { id: this.users.length + 1, email, phone, name, created_at: new Date() };
    this.users.push(user);
    return user;
  },

  async findUsers({ sortBy, order }) {
    const { column, order: safeOrder } = safeOrderBy(sortBy, order);
    const sorted = [...this.users].sort((a, b) => {
      const av = a[column], bv = b[column];
      if (av < bv) return safeOrder === 'ASC' ? -1 : 1;
      if (av > bv) return safeOrder === 'ASC' ? 1 : -1;
      return 0;
    });
    return sorted;
  },

  async findUserByEmail(email) {
    // Параметризованный поиск (в реальном ORM — where: { email })
    return this.users.find((u) => u.email === email) || null;
  },
};

// ============================================================
// 9. Контроллеры
// ============================================================

const userController = {
  create: asyncHandler(async (req, res) => {
    const { email, phone, name } = req.body;

    const existing = await db.findUserByEmail(email);
    if (existing) {
      throw new AppError('Пользователь с таким email уже существует', 409, 'CONFLICT');
    }

    const user = await db.createUser({ email, phone, name });
    res.status(201).json({ success: true, data: user });
  }),

  list: asyncHandler(async (req, res) => {
    const { sortBy, order } = req.query;
    const users = await db.findUsers({ sortBy, order });
    res.json({ success: true, data: users });
  }),
};

const bookingController = {
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut, capacity, price } = req.body;

    // Логика дат: checkOut позже checkIn
    if (new Date(checkOut) <= new Date(checkIn)) {
      throw new ValidationError('Дата выезда должна быть позже даты заезда', [
        { field: 'checkOut', message: 'checkOut должен быть позже checkIn' },
      ]);
    }

    // Имитация параметризованного UPDATE
    res.json({
      success: true,
      data: { id, checkIn, checkOut, capacity, price: price ?? null },
    });
  }),
};

const authController = {
  login: asyncHandler(async (req, res) => {
    // Заглушка — здесь была бы проверка учётных данных
    res.json({ success: true, message: 'OK' });
  }),
};

// ============================================================
// 10. Маршруты
// ============================================================

app.post('/api/users', createUserSchema, validate, userController.create);
app.get('/api/users', userController.list);
app.put('/api/bookings/:id', updateBookingSchema, validate, bookingController.update);
app.post('/api/auth/login', authLimiter, authController.login);

// Healthcheck
app.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));

// 404 для несуществующих маршрутов
app.all('*', (req, _res, next) => {
  next(new NotFoundError(`Маршрут ${req.originalUrl} не найден`));
});

// ============================================================
// 11. Централизованный обработчик ошибок (единый формат)
// ============================================================

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  console.error(`[ERROR] ${err.name}: ${err.message}`);

  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Внутренняя ошибка сервера';
  let details = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    code = 'DATABASE_VALIDATION_ERROR';
    message = 'Ошибка валидации данных';
    details = err.errors?.map((e) => ({ field: e.path, message: e.message })) || null;
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Тело запроса слишком большое';
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Некорректный JSON в теле запроса';
  }

  const response = {
    success: false,
    error: { code, message },
  };
  if (details) response.error.details = details;
  if (NODE_ENV === 'development' && statusCode >= 500) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

app.use(errorHandler);

// ============================================================
// 12. Запуск сервера
// ============================================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} [${NODE_ENV}]`);
  });
}

module.exports = app;
