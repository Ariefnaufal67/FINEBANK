const bcrypt = require('bcryptjs');
const { sequelize, User, Category, Expense, Bill } = require('./models');

(async () => {
  await sequelize.sync({ force: true });
  const hash = await bcrypt.hash('password123', 10);
  const admin = await User.create({ name: 'Admin FineBank', email: 'admin@finebank.test', passwordHash: hash, role: 'admin' });
  const user = await User.create({ name: 'Arief', email: 'arief@finebank.test', passwordHash: hash, role: 'user' });
  const [food, transport, study] = await Category.bulkCreate(
    ['Food', 'Transport', 'Entertainment'].map((name) => ({ name, userId: user.id })), { returning: true });
  const d = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  await Expense.bulkCreate([
    { userId: user.id, categoryId: food.id, title: 'Makan siang', amount: 25000, date: d(-1) },
    { userId: user.id, categoryId: food.id, title: 'Kopi', amount: 18000, date: d(-2) },
    { userId: user.id, categoryId: transport.id, title: 'Bensin', amount: 50000, date: d(-3) },
    { userId: user.id, categoryId: study.id, title: 'Nonton film', amount: 45000, date: d(-5) },
  ]);
  await Bill.bulkCreate([
    { userId: user.id, name: 'Internet', amount: 350000, dueDate: d(5) },
    { userId: user.id, name: 'Listrik', amount: 200000, dueDate: d(-3) },
    { userId: user.id, name: 'Kos', amount: 800000, dueDate: d(-10), status: 'paid', paidAt: new Date() },
  ]);
  console.log('Seed selesai. Login: admin@finebank.test / arief@finebank.test, password: password123', { admin: admin.id });
  process.exit(0);
})();
