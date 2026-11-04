// Statistik: query relasional + agregasi di database (setara course-stat / user-stats di materi 7).
const router = require('express').Router();
const { Op, fn, col, literal } = require('sequelize');
const { sequelize, User, Category, Expense, Bill } = require('../models');
const { requireRole } = require('../middleware/auth');

const scope = (req) => (req.user.role === 'admin' ? {} : { userId: req.user.id });
const today = () => new Date().toISOString().slice(0, 10);
const num = (v) => (v == null ? 0 : Number(v));
const monthOf = () => (sequelize.getDialect() === 'postgres' ? fn('to_char', col('date'), 'YYYY-MM') : fn('strftime', '%Y-%m', col('date')));
const brief = (e) => ({ id: e.id, title: e.title, amount: e.amount, date: e.date, category: e.category ? e.category.name : null });
const include = [{ model: Category, as: 'category', attributes: ['id', 'name'] }];

// Ringkasan pengeluaran: aggregate + GROUP BY + JOIN kategori
router.get('/expenses', async (req, res) => {
  const where = scope(req);
  const [agg, cheapest, priciest, byCat, monthly] = await Promise.all([
    Expense.findOne({
      where, raw: true,
      attributes: [[fn('COUNT', col('id')), 'count'], [fn('SUM', col('amount')), 'total'], [fn('MIN', col('amount')), 'min'], [fn('MAX', col('amount')), 'max'], [fn('AVG', col('amount')), 'avg']],
    }),
    Expense.findAll({ where, include, order: [['amount', 'ASC'], ['id', 'ASC']], limit: 3 }),
    Expense.findAll({ where, include, order: [['amount', 'DESC'], ['id', 'ASC']], limit: 3 }),
    Expense.findAll({
      where, raw: true,
      attributes: [[fn('SUM', col('Expense.amount')), 'total'], [fn('COUNT', col('Expense.id')), 'count']],
      include: [{ model: Category, as: 'category', attributes: ['name'] }],
      group: ['category.name'], // gabungkan per nama kategori (admin: lintas user)
      order: [[literal('total'), 'DESC']], limit: 10,
    }),
    Expense.findAll({
      where, raw: true,
      attributes: [[monthOf(), 'month'], [fn('SUM', col('amount')), 'total'], [fn('COUNT', col('id')), 'count']],
      group: ['month'], order: [[literal('month'), 'ASC']],
    }),
  ]);
  res.json({
    success: true,
    data: {
      expenseCount: num(agg.count),
      total: num(agg.total),
      min: num(agg.min),
      max: num(agg.max),
      avg: Math.round(num(agg.avg) * 100) / 100,
      cheapest: cheapest.map(brief),
      mostExpensive: priciest.map(brief),
      byCategory: byCat.map((r) => ({ category: r['category.name'] || 'Tanpa kategori', total: num(r.total), count: num(r.count) })),
      monthly: monthly.slice(-12).map((r) => ({ month: r.month, total: num(r.total), count: num(r.count) })),
    },
  });
});

// Statistik tagihan per status; overdue dihitung (unpaid + lewat jatuh tempo)
router.get('/bills', async (req, res) => {
  const where = scope(req);
  const [groups, overdue] = await Promise.all([
    Bill.findAll({ where, raw: true, attributes: ['status', [fn('COUNT', col('id')), 'count'], [fn('SUM', col('amount')), 'total']], group: ['status'] }),
    Bill.findOne({ where: { ...where, status: 'unpaid', dueDate: { [Op.lt]: today() } }, raw: true, attributes: [[fn('COUNT', col('id')), 'count'], [fn('SUM', col('amount')), 'total']] }),
  ]);
  const pick = (s) => { const g = groups.find((x) => x.status === s); return { count: g ? num(g.count) : 0, total: g ? num(g.total) : 0 }; };
  res.json({ success: true, data: { paid: pick('paid'), unpaid: pick('unpaid'), overdue: { count: num(overdue.count), total: num(overdue.total) } } });
});

// Statistik pengguna (admin): LEFT JOIN + GROUP BY, subquery NOT IN
router.get('/users', requireRole('admin'), async (req, res) => {
  const [totalUsers, withExpenses, totalExpenses, top, noExpenses] = await Promise.all([
    User.count({ where: { role: 'user' } }),
    Expense.count({ distinct: true, col: 'userId' }),
    Expense.count(),
    User.findAll({
      where: { role: 'user' }, raw: true,
      attributes: ['id', 'name', 'email', [fn('COUNT', col('Expenses.id')), 'expenseCount'], [fn('COALESCE', fn('SUM', col('Expenses.amount')), 0), 'total']],
      include: [{ model: Expense, attributes: [], required: false }],
      subQuery: false, group: ['User.id'], order: [[literal('"expenseCount"'), 'DESC'], ['id', 'ASC']], limit: 5,
    }),
    User.findAll({
      where: { role: 'user', id: { [Op.notIn]: literal('(SELECT DISTINCT "userId" FROM expenses)') } },
      attributes: ['id', 'name', 'email'], order: [['id', 'ASC']], limit: 20, raw: true,
    }),
  ]);
  res.json({
    success: true,
    data: {
      totalUsers,
      usersWithExpenses: withExpenses,
      usersWithoutExpenses: Math.max(totalUsers - withExpenses, 0),
      avgExpensesPerUser: totalUsers ? Math.round((totalExpenses / totalUsers) * 100) / 100 : 0,
      topUsers: top.map((u) => ({ id: u.id, name: u.name, email: u.email, expenseCount: num(u.expenseCount), total: num(u.total) })),
      usersNoExpenses: noExpenses,
    },
  });
});

module.exports = router;
