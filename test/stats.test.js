const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const { request, setup, makeAdmin, auth, sequelize } = require('./helpers');
const { importCsv, parseCsv } = require('../src/importer');
const path = require('node:path');

let app, admin, najwa;
const login = async (email) => (await request(app).post('/api/auth/login').send({ email, password: 'password123' })).body.data.token;

before(async () => {
  app = await setup();
  admin = await makeAdmin(app);
});

test('parseCsv menangani kutip dan koma di dalam kutip', () => {
  const rows = parseCsv('a,b\n"x, y",2\n"say ""hi""",3\n');
  assert.deepEqual(rows, [{ a: 'x, y', b: '2' }, { a: 'say "hi"', b: '3' }]);
});

test('import CSV memasukkan data massal dan idempotent', async () => {
  const dir = path.join(__dirname, '..', 'csv_data');
  const first = await importCsv(dir, { bcryptRounds: 4 });
  assert.deepEqual({ ...first }, { users: 4, categories: 7, expenses: 18, bills: 6, skipped: 0 });
  const second = await importCsv(dir, { bcryptRounds: 4 });
  assert.deepEqual({ ...second }, { users: 0, categories: 0, expenses: 0, bills: 0, skipped: 0 });
  najwa = await login('najwa@finebank.test'); // user hasil import bisa login
  assert.ok(najwa);
});

test('/api/stats/expenses: agregasi benar untuk data hasil import', async () => {
  const res = await request(app).get('/api/stats/expenses').set(auth(najwa));
  assert.equal(res.status, 200);
  const d = res.body.data;
  assert.equal(d.expenseCount, 8);
  assert.equal(d.total, 264000); // 18+22+50+45+35+27+12+55 (ribu)
  assert.equal(d.min, 12000);
  assert.equal(d.max, 55000);
  assert.equal(d.avg, 33000);
  assert.equal(d.cheapest[0].title, 'Sarapan');
  assert.equal(d.mostExpensive[0].title, 'Langganan musik');
  assert.equal(d.byCategory[0].category, 'Hiburan'); // 45+55 = 100rb, terbesar
  assert.equal(d.byCategory[0].total, 100000);
  assert.equal(d.byCategory[1].category, 'Makanan'); // 18+22+35+12 = 87rb
  assert.deepEqual(d.monthly.map((m) => m.month), ['2026-09', '2026-10']);
  assert.equal(d.monthly[0].total, 135000);
});

test('/api/stats/expenses: admin melihat gabungan semua user', async () => {
  const d = (await request(app).get('/api/stats/expenses').set(auth(admin))).body.data;
  assert.equal(d.expenseCount, 18);
});

test('/api/stats/bills: paid, unpaid, overdue', async () => {
  const d = (await request(app).get('/api/stats/bills').set(auth(najwa))).body.data;
  assert.deepEqual(d.paid, { count: 1, total: 350000 });
  assert.deepEqual(d.unpaid, { count: 2, total: 1000000 });
  assert.ok(d.overdue.count <= d.unpaid.count);
});

test('/api/stats/users: hanya admin; berisi top user dan user tanpa pengeluaran', async () => {
  assert.equal((await request(app).get('/api/stats/users').set(auth(najwa))).status, 403);
  const d = (await request(app).get('/api/stats/users').set(auth(admin))).body.data;
  assert.equal(d.totalUsers, 3);
  assert.equal(d.usersWithExpenses, 3);
  assert.equal(d.usersWithoutExpenses, 0);
  assert.equal(d.avgExpensesPerUser, 6);
  assert.equal(d.topUsers[0].email, 'najwa@finebank.test');
  assert.equal(d.topUsers[0].expenseCount, 8);
  await request(app).post('/api/auth/register').send({ name: 'Baru', email: 'baru@test.dev', password: 'password123' });
  const d2 = (await request(app).get('/api/stats/users').set(auth(admin))).body.data;
  assert.equal(d2.usersNoExpenses.length, 1);
  assert.equal(d2.usersNoExpenses[0].email, 'baru@test.dev');
});
