const test = require('node:test');
const assert = require('node:assert/strict');
const { request, setup, register, makeAdmin, auth } = require('./helpers');

let app, token;
test.beforeEach(async () => {
  app = await setup({ rateLimit: { max: 1000, authMax: 1000 } });
  token = await register(app, 'u@test.dev');
});

const create = (body, t = token) => request(app).post('/api/expenses').set(auth(t)).send(body);

test('endpoint expenses wajib login', async () => {
  assert.equal((await request(app).get('/api/expenses')).status, 401);
});

test('CRUD expense', async () => {
  const c = await create({ title: 'Makan', amount: 25000, date: '2026-10-01' });
  assert.equal(c.status, 201);
  assert.equal(c.body.data.amount, 25000);
  const id = c.body.data.id;

  assert.equal((await request(app).get(`/api/expenses/${id}`).set(auth(token))).body.data.title, 'Makan');
  const u = await request(app).put(`/api/expenses/${id}`).set(auth(token)).send({ amount: 30000 });
  assert.equal(u.body.data.amount, 30000);
  assert.equal((await request(app).delete(`/api/expenses/${id}`).set(auth(token))).status, 204);
  assert.equal((await request(app).get(`/api/expenses/${id}`).set(auth(token))).status, 404);
});

test('validasi: nominal negatif & format tanggal salah', async () => {
  assert.equal((await create({ title: 'x', amount: -5, date: '2026-10-01' })).status, 400);
  assert.equal((await create({ title: 'x', amount: 5, date: '01/10/2026' })).status, 400);
  assert.equal((await create({ amount: 5, date: '2026-10-01' })).status, 400);
});

test('pagination memberi meta yang benar', async () => {
  for (let i = 1; i <= 12; i++) await create({ title: `Item ${i}`, amount: i * 1000, date: `2026-10-${String(i).padStart(2, '0')}` });
  const p1 = await request(app).get('/api/expenses?limit=5').set(auth(token));
  assert.equal(p1.body.data.length, 5);
  assert.deepEqual(p1.body.meta, { page: 1, limit: 5, total: 12, totalPages: 3, hasNext: true, hasPrev: false });
  const p3 = await request(app).get('/api/expenses?limit=5&page=3').set(auth(token));
  assert.equal(p3.body.data.length, 2);
  assert.equal(p3.body.meta.hasNext, false);
});

test('filter: q, rentang nominal, rentang tanggal, kategori; sort', async () => {
  const cat = (await request(app).post('/api/categories').set(auth(token)).send({ name: 'Makanan' })).body.data;
  await create({ title: 'Nasi goreng', amount: 20000, date: '2026-10-01', categoryId: cat.id });
  await create({ title: 'Kopi susu', amount: 15000, date: '2026-10-10', categoryId: cat.id });
  await create({ title: 'Bensin', amount: 50000, date: '2026-10-20' });
  const get = async (qs) => (await request(app).get(`/api/expenses?${qs}`).set(auth(token))).body.data.map((e) => e.title);

  assert.deepEqual(await get('q=kopi'), ['Kopi susu']);
  assert.deepEqual((await get('minAmount=16000&sort=amount')), ['Nasi goreng', 'Bensin']);
  assert.deepEqual(await get('maxAmount=15000'), ['Kopi susu']);
  assert.deepEqual(await get('from=2026-10-05&to=2026-10-15'), ['Kopi susu']);
  assert.deepEqual((await get(`categoryId=${cat.id}&sort=-amount`)), ['Nasi goreng', 'Kopi susu']);
  assert.equal((await request(app).get('/api/expenses?from=besok').set(auth(token))).status, 400);
});

test('isolasi data: user lain tidak bisa akses, admin bisa', async () => {
  const other = await register(app, 'other@test.dev');
  const e = await create({ title: 'Rahasia', amount: 1000, date: '2026-10-01' });
  const id = e.body.data.id;
  assert.equal((await request(app).get(`/api/expenses/${id}`).set(auth(other))).status, 404);
  assert.equal((await request(app).delete(`/api/expenses/${id}`).set(auth(other))).status, 404);
  assert.equal((await request(app).get('/api/expenses').set(auth(other))).body.meta.total, 0);
  const admin = await makeAdmin(app);
  assert.equal((await request(app).get('/api/expenses').set(auth(admin))).body.meta.total, 1);
});

test('categoryId milik user lain ditolak', async () => {
  const other = await register(app, 'other@test.dev');
  const cat = (await request(app).post('/api/categories').set(auth(other)).send({ name: 'Punya Orang' })).body.data;
  assert.equal((await create({ title: 'x', amount: 1, date: '2026-10-01', categoryId: cat.id })).status, 400);
});

test('summary menjumlah total per kategori', async () => {
  const cat = (await request(app).post('/api/categories').set(auth(token)).send({ name: 'Makanan' })).body.data;
  await create({ title: 'a', amount: 1000, date: '2026-10-01', categoryId: cat.id });
  await create({ title: 'b', amount: 2000, date: '2026-10-02', categoryId: cat.id });
  await create({ title: 'c', amount: 500, date: '2026-10-03' });
  const res = await request(app).get('/api/expenses/summary').set(auth(token));
  assert.deepEqual(res.body.data, { total: 3500, count: 3, byCategory: { Makanan: 3000, 'Tanpa kategori': 500 } });
});
