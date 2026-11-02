const router = require('express').Router();
const { Op } = require('sequelize');
const { Bill } = require('../models');
const validate = require('../middleware/validate');
const { billCreate, billUpdate, billQuery } = require('../schemas');
const { parsePagination, parseSort, buildMeta } = require('../utils/pagination');
const { contains } = require('../utils/like');
const { notFound } = require('../utils/errors');

const scope = (req) => (req.user.role === 'admin' ? {} : { userId: req.user.id });
const today = () => new Date().toISOString().slice(0, 10);

// "overdue" tidak disimpan; dihitung dari status unpaid + dueDate < hari ini.
const withDerived = (b) => {
  const j = b.toJSON();
  j.isOverdue = j.status === 'unpaid' && j.dueDate < today();
  return j;
};

router.get('/', validate(billQuery, 'query'), async (req, res) => {
  const f = req.valid.query;
  const where = { ...scope(req) };
  if (f.q) where.name = contains(f.q);
  if (f.status === 'overdue') { where.status = 'unpaid'; where.dueDate = { [Op.lt]: today() }; }
  else if (f.status) where.status = f.status;
  if (f.from || f.to) {
    const range = where.dueDate || {};
    if (f.from) range[Op.gte] = f.from;
    if (f.to) range[Op.lte] = f.to;
    where.dueDate = range;
  }
  const p = parsePagination(f);
  const order = parseSort(f.sort, ['dueDate', 'amount', 'name', 'createdAt'], [['dueDate', 'ASC'], ['id', 'ASC']]);
  const { rows, count } = await Bill.findAndCountAll({ where, order, limit: p.limit, offset: p.offset });
  res.json({ success: true, data: rows.map(withDerived), meta: buildMeta(p, count) });
});

router.get('/:id', async (req, res) => {
  const b = await Bill.findOne({ where: { id: req.params.id, ...scope(req) } });
  if (!b) throw notFound('Bill tidak ditemukan');
  res.json({ success: true, data: withDerived(b) });
});

router.post('/', validate(billCreate), async (req, res) => {
  const b = await Bill.create({ ...req.valid.body, userId: req.user.id });
  res.status(201).json({ success: true, data: withDerived(b) });
});

router.put('/:id', validate(billUpdate), async (req, res) => {
  const b = await Bill.findOne({ where: { id: req.params.id, ...scope(req) } });
  if (!b) throw notFound('Bill tidak ditemukan');
  const patch = { ...req.valid.body };
  if (patch.status === 'paid' && b.status !== 'paid') patch.paidAt = new Date();
  if (patch.status === 'unpaid') patch.paidAt = null;
  await b.update(patch);
  res.json({ success: true, data: withDerived(b) });
});

router.post('/:id/pay', async (req, res) => {
  const b = await Bill.findOne({ where: { id: req.params.id, ...scope(req) } });
  if (!b) throw notFound('Bill tidak ditemukan');
  if (b.status !== 'paid') await b.update({ status: 'paid', paidAt: new Date() });
  res.json({ success: true, data: withDerived(b) });
});

router.delete('/:id', async (req, res) => {
  const b = await Bill.findOne({ where: { id: req.params.id, ...scope(req) } });
  if (!b) throw notFound('Bill tidak ditemukan');
  await b.destroy();
  res.status(204).end();
});

module.exports = router;
