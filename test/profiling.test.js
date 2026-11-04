const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { request, setup, register, makeAdmin, auth } = require('./helpers');
const profiler = require('../src/utils/profiler');

let app, token, admin;
before(async () => {
  app = await setup();
  token = await register(app, 'prof@test.dev');
  admin = await makeAdmin(app);
  profiler.enabled = true;
  profiler.reset();
});
after(() => { profiler.enabled = false; });

const create = (body) => request(app).post('/api/expenses').set(auth(token)).send(body);

test('header X-DB-Query-Count dan X-DB-Time-Ms muncul saat profiling aktif', async () => {
  const res = await request(app).get('/api/expenses').set(auth(token));
  assert.equal(res.status, 200);
  assert.ok(Number(res.headers['x-db-query-count']) >= 1);
  assert.ok(res.headers['x-db-time-ms'] !== undefined);
});

test('daftar expense berisi kategori tetap hanya 2 query (data+count), tanpa N+1', async () => {
  const cat = (await request(app).post('/api/categories').set(auth(token)).send({ name: 'Makanan' })).body.data;
  for (let i = 0; i < 12; i++) await create({ title: `e${i}`, amount: 100, date: '2026-10-01', categoryId: cat.id });
  const res = await request(app).get('/api/expenses?limit=12').set(auth(token));
  assert.equal(res.body.data.length, 12);
  assert.ok(res.body.data.every((e) => e.category.name === 'Makanan'));
  assert.equal(res.headers['x-db-query-count'], '3'); // 1 auth + 1 data (JOIN kategori) + 1 count
});

test('summary memakai agregasi SQL: jumlah query konstan walau banyak baris', async () => {
  const res = await request(app).get('/api/expenses/summary').set(auth(token));
  assert.equal(res.body.data.total, 1200);
  assert.equal(res.body.data.count, 12);
  assert.equal(res.headers['x-db-query-count'], '3'); // 1 auth + 1 GROUP BY + 1 nama kategori
});

test('/api/profiling hanya untuk admin dan memuat statistik', async () => {
  assert.equal((await request(app).get('/api/profiling').set(auth(token))).status, 403);
  const res = await request(app).get('/api/profiling').set(auth(admin));
  assert.equal(res.status, 200);
  assert.equal(res.body.data.enabled, true);
  assert.ok(res.body.data.queries > 0);
  assert.ok(Array.isArray(res.body.data.slowest));
});
