const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const SECRET = process.env.JWT_SECRET || 'dev-secret';

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }
  const exists = await User.findOne({ where: { email } });
  if (exists) return res.status(409).json({ error: 'Email taken' });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password_hash: hash, role: 'guest' });
  res.status(201).json({ id: user.id, email: user.email, role: user.role });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ user_id: user.id, role: user.role }, SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

module.exports = router;