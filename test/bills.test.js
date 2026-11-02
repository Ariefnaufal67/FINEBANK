const test = require('node:test');
const assert = require('node:assert/strict');
const { request, setup, register, makeAdmin, auth } = require('./helpers');

let app, token;
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
test.beforeEach(async () => {
  app = await setup({ rateLimit: { max: 1000, authMax: 1000 } });
  token = await register(app, 'u@test.dev');
});
const create = (b) => request(app).post('/api/bills').set(auth(token)).send(b);

test('buat bill: default unpaid dan isOverdue dihitung', async () => {
  const future = await create({ name: 'Internet', amount: 350000, dueDate: day(5) });
  assert.equal(future.status, 201);
  assert.equal(future.body.data.status, 'unpaid');
  assert.equal(future.body.data.isOverdue, false);
  const past = await create({ name: 'Listrik', amount: 200000, dueDate: day(-2) });
  assert.equal(past.body.data.isOverdue, true);
});

test('bayar bill mengubah status dan mengisi paidAt', async () => {
  const b = (await create({ name: 'Kos', amount: 800000, dueDate: day(-1) })).body.data;
  const res = await request(app).post(`/api/bills/${b.id}/pay`).set(auth(token));
  assert.equal(res.body.data.status, 'paid');
  assert.ok(res.body.data.paidAt);
  assert.equal(res.body.data.isOverdue, false);
});

test('filter status paid / unpaid / overdue', async () => {
  await create({ name: 'A', amount: 1, dueDate: day(3) });
  const od = (await create({ name: 'B', amount: 1, dueDate: day(-3) })).body.data;
  const paid = (await create({ name: 'C', amount: 1, dueDate: day(-9) })).body.data;
  await request(app).put(`/api/bills/${paid.id}`).set(auth(token)).send({ status: 'paid' });
  const names = async (s) => (await request(app).get(`/api/bills?status=${s}&sort=name`).set(auth(token))).body.data.map((b) => b.name);
  assert.deepEqual(await names('unpaid'), ['A', 'B']);
  assert.deepEqual(await names('paid'), ['C']);
  assert.deepEqual(await names('overdue'), ['B']);
  assert.equal(od.name, 'B');
  assert.equal((await request(app).get('/api/bills?status=ngawur').set(auth(token))).status, 400);
});

test('pagination bills dan isolasi antar user', async () => {
  for (let i = 0; i < 7; i++) await create({ name: `Bill ${i}`, amount: 1000, dueDate: day(i) });
  const res = await request(app).get('/api/bills?limit=3&page=2').set(auth(token));
  assert.equal(res.body.data.length, 3);
  assert.equal(res.body.meta.totalPages, 3);
  const other = await register(app, 'o@test.dev');
  assert.equal((await request(app).get('/api/bills').set(auth(other))).body.meta.total, 0);
});

test('endpoint /api/users hanya untuk admin', async () => {
  assert.equal((await request(app).get('/api/users').set(auth(token))).status, 403);
  const admin = await makeAdmin(app);
  const res = await request(app).get('/api/users?role=admin').set(auth(admin));
  assert.equal(res.status, 200);
  assert.equal(res.body.meta.total, 1);
  assert.equal(JSON.stringify(res.body).includes('passwordHash'), false);
});

test('404 untuk route tidak dikenal dan JSON rusak -> 400', async () => {
  assert.equal((await request(app).get('/api/tidak-ada').set(auth(token))).status, 404);
  const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{rusak');
  assert.equal(res.status, 400);
});
