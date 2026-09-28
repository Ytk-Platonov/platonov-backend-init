const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev-secret';

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

module.exports = { authRequired, adminOnly };
=======

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Неавторизованный доступ. Требуется токен.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // В реальном проекте секрет берется из process.env.JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key');
    req.user = decoded; // Добавляем пользователя в запрос (например, { id: 1, role: 'guest' })
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Недействительный или просроченный токен' });
  }
};