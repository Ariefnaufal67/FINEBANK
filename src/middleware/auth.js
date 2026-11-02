const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { unauthorized, forbidden } = require('../utils/errors');

async function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized('Token Bearer wajib disertakan');
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized('Token tidak valid atau kedaluwarsa');
  }
  const user = await User.findByPk(payload.sub);
  if (!user) throw unauthorized('Pengguna tidak ditemukan');
  req.user = user;
  next();
}

const requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) throw forbidden('Role Anda tidak diizinkan mengakses resource ini');
  next();
};

const signToken = (user) =>
  jwt.sign({ sub: user.id, name: user.name, email: user.email, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

module.exports = { authenticate, requireRole, signToken };
