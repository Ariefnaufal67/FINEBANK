const router = require('express').Router();
const { Op } = require('sequelize');
const { User } = require('../models');
const { parsePagination, buildMeta } = require('../utils/pagination');
const { contains } = require('../utils/like');
const { notFound, badRequest } = require('../utils/errors');

// Khusus admin (dipasang dengan requireRole('admin') di app.js)
router.get('/', async (req, res) => {
  const p = parsePagination(req.query);
  const where = {};
  if (req.query.q) where[Op.or] = [{ name: contains(req.query.q) }, { email: contains(req.query.q) }];
  if (['admin', 'user'].includes(req.query.role)) where.role = req.query.role;
  const { rows, count } = await User.findAndCountAll({ where, order: [['id', 'ASC']], limit: p.limit, offset: p.offset });
  res.json({ success: true, data: rows, meta: buildMeta(p, count) });
});

router.delete('/:id', async (req, res) => {
  if (Number(req.params.id) === req.user.id) throw badRequest('Tidak dapat menghapus akun sendiri');
  const u = await User.findByPk(req.params.id);
  if (!u) throw notFound('User tidak ditemukan');
  await u.destroy();
  res.status(204).end();
});

module.exports = router;
