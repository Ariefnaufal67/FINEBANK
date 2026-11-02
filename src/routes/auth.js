const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const validate = require('../middleware/validate');
const { authenticate, signToken } = require('../middleware/auth');
const { registerSchema, loginSchema } = require('../schemas');
const { conflict, unauthorized } = require('../utils/errors');

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

router.post('/register', validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.valid.body;
  if (await User.findOne({ where: { email } })) throw conflict('Email sudah terdaftar');
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10), role: 'user' });
  res.status(201).json({ success: true, data: { user: publicUser(user), token: signToken(user) } });
});

router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw unauthorized('Email atau password salah');
  res.json({ success: true, data: { user: publicUser(user), token: signToken(user) } });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, data: publicUser(req.user) });
});

module.exports = router;
