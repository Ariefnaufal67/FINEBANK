const router = require('express').Router();
const { Op, fn, col } = require('sequelize');
const { Expense, Category } = require('../models');
const validate = require('../middleware/validate');
const { expenseCreate, expenseUpdate, expenseQuery } = require('../schemas');
const { parsePagination, parseSort, buildMeta } = require('../utils/pagination');
const { contains } = require('../utils/like');
const { notFound, badRequest } = require('../utils/errors');

const include = [{ model: Category, as: 'category', attributes: ['id', 'name'] }];
// Admin melihat semua data; user biasa hanya miliknya.
const scope = (req) => (req.user.role === 'admin' ? {} : { userId: req.user.id });

async function assertCategory(req, categoryId) {
  if (categoryId == null) return;
  const cat = await Category.findOne({ where: { id: categoryId, userId: req.user.id }, attributes: ['id'] });
  if (!cat) throw badRequest('categoryId tidak valid');
}

router.get('/', validate(expenseQuery, 'query'), async (req, res) => {
  const f = req.valid.query;
  const where = { ...scope(req) };
  if (f.q) where.title = contains(f.q);
  if (f.categoryId) where.categoryId = f.categoryId;
  if (f.minAmount != null || f.maxAmount != null) {
    where.amount = {};
    if (f.minAmount != null) where.amount[Op.gte] = f.minAmount;
    if (f.maxAmount != null) where.amount[Op.lte] = f.maxAmount;
  }
  if (f.from || f.to) {
    where.date = {};
    if (f.from) where.date[Op.gte] = f.from;
    if (f.to) where.date[Op.lte] = f.to;
  }
  const p = parsePagination(f);
  const order = parseSort(f.sort, ['date', 'amount', 'title', 'createdAt'], [['date', 'DESC'], ['id', 'DESC']]);
  // Optimasi: count tanpa JOIN (kategori tidak memengaruhi jumlah baris), dijalankan paralel dengan data.
  const [rows, count] = await Promise.all([
    Expense.findAll({ where, include, order, limit: p.limit, offset: p.offset }),
    Expense.count({ where }),
  ]);
  res.json({ success: true, data: rows, meta: buildMeta(p, count) });
});

router.get('/summary', async (req, res) => {
  // Optimasi: agregasi di database (GROUP BY), bukan memuat semua baris lalu menjumlah di JS.
  const groups = await Expense.findAll({
    where: scope(req),
    attributes: ['categoryId', [fn('SUM', col('amount')), 'total'], [fn('COUNT', col('id')), 'count']],
    group: ['categoryId'],
    raw: true,
  });
  const ids = groups.map((g) => g.categoryId).filter((id) => id != null);
  const names = new Map((ids.length ? await Category.findAll({ where: { id: ids }, attributes: ['id', 'name'], raw: true }) : []).map((c) => [c.id, c.name]));
  const byCategory = {};
  let total = 0;
  let count = 0;
  for (const g of groups) {
    const key = g.categoryId != null && names.has(g.categoryId) ? names.get(g.categoryId) : 'Tanpa kategori';
    byCategory[key] = (byCategory[key] || 0) + Number(g.total);
    total += Number(g.total);
    count += Number(g.count);
  }
  res.json({ success: true, data: { total, count, byCategory } });
});

router.get('/:id', async (req, res) => {
  const e = await Expense.findOne({ where: { id: req.params.id, ...scope(req) }, include });
  if (!e) throw notFound('Expense tidak ditemukan');
  res.json({ success: true, data: e });
});

router.post('/', validate(expenseCreate), async (req, res) => {
  await assertCategory(req, req.valid.body.categoryId);
  const e = await Expense.create({ ...req.valid.body, userId: req.user.id });
  res.status(201).json({ success: true, data: await Expense.findByPk(e.id, { include }) });
});

router.put('/:id', validate(expenseUpdate), async (req, res) => {
  const e = await Expense.findOne({ where: { id: req.params.id, ...scope(req) } });
  if (!e) throw notFound('Expense tidak ditemukan');
  await assertCategory(req, req.valid.body.categoryId);
  await e.update(req.valid.body);
  res.json({ success: true, data: await Expense.findByPk(e.id, { include }) });
});

router.delete('/:id', async (req, res) => {
  const e = await Expense.findOne({ where: { id: req.params.id, ...scope(req) } });
  if (!e) throw notFound('Expense tidak ditemukan');
  await e.destroy();
  res.status(204).end();
});

module.exports = router;
