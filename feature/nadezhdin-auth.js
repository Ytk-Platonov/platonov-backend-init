const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());

// Настройка базы данных (замени на свои настройки из .env)
const sequelize = new Sequelize(
  process.env.DB_NAME || 'hotel_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false
  }
);

// ============================================
// МОДЕЛЬ USER
// ============================================
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('guest', 'admin'),
    allowNull: false,
    defaultValue: 'guest'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 10);
      }
    }
  }
});

User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

// ============================================
// МИДЛВАРЫ
// ============================================
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Токен не предоставлен, блядь' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Юзер не найден' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Токен невалидный, нахуй пошел' });
  }
};

const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'У тебя нет прав на это, пёс' });
    }
    next();
  };
};

// ============================================
// КОНТРОЛЛЕРЫ
// ============================================
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '24h' }
  );
};

const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email уже занят, иди придумай другой' });
    }

    const user = await User.create({
      email,
      password_hash: password,
      role: role === 'admin' ? 'admin' : 'guest'
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Юзер успешно создан',
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Успешный вход',
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Ошибка логина:', error);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
};

const getMe = async (req, res) => {
  res.json({
    user: { id: req.user.id, email: req.user.email, role: req.user.role }
  });
};

// ============================================
// РОУТЫ
// ============================================
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', authenticate, getMe);

// Пример защищенного роута для админов
app.get('/api/admin/test', authenticate, authorizeRole('admin'), (req, res) => {
  res.json({ message: 'Добро пожаловать, админ, блядь' });
});

// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('База данных подключена, блядь');
    
    // Синхронизация моделей (в продакшене используй миграции!)
    await sequelize.sync({ alter: true });
    console.log('Модели синхронизированы');
    
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
    });
  } catch (error) {
    console.error('Ошибка запуска сервера:', error);
    process.exit(1);
  }
})();
