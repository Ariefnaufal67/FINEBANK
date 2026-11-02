const test = require('node:test');
const assert = require('node:assert/strict');
const { request, setup, register, auth } = require('./helpers');

let app;
test.beforeEach(async () => { app = await setup({ rateLimit: { max: 1000, authMax: 1000 } }); });

test('register berhasil dan password tidak bocor', async () => {
  const res = await request(app).post('/api/auth/register').send({ name: 'Arief', email: 'A@Test.dev', password: 'password123' });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.user.email, 'a@test.dev');
  assert.ok(res.body.data.token);
  assert.equal(JSON.stringify(res.body).includes('passwordHash'), false);
});

test('JWT memuat name, email, role (dipakai jwtDecode di frontend)', async () => {
  const token = await register(app, 'claim@test.dev', 'Nama Claim');
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
  assert.equal(payload.name, 'Nama Claim');
  assert.equal(payload.email, 'claim@test.dev');
  assert.equal(payload.role, 'user');
});

test('register menolak input tidak valid dan email duplikat', async () => {
  const bad = await request(app).post('/api/auth/register').send({ name: 'A', email: 'x', password: '123' });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.errors.length >= 2);
  await register(app, 'dup@test.dev');
  const dup = await request(app).post('/api/auth/register').send({ name: 'Dup', email: 'dup@test.dev', password: 'password123' });
  assert.equal(dup.status, 409);
});

test('login benar dan salah', async () => {
  await register(app, 'u@test.dev');
  const ok = await request(app).post('/api/auth/login').send({ email: 'u@test.dev', password: 'password123' });
  assert.equal(ok.status, 200);
  const bad = await request(app).post('/api/auth/login').send({ email: 'u@test.dev', password: 'salahsalah' });
  assert.equal(bad.status, 401);
});

test('/me butuh token valid', async () => {
  const token = await register(app, 'me@test.dev');
  assert.equal((await request(app).get('/api/auth/me')).status, 401);
  assert.equal((await request(app).get('/api/auth/me').set(auth('bukan.token.valid'))).status, 401);
  const res = await request(app).get('/api/auth/me').set(auth(token));
  assert.equal(res.status, 200);
  assert.equal(res.body.data.email, 'me@test.dev');
});

test('throttling: login diblokir 429 setelah melewati batas', async () => {
  const limited = await setup({ rateLimit: { max: 1000, authMax: 3 } });
  const codes = [];
  for (let i = 0; i < 5; i++) {
    codes.push((await request(limited).post('/api/auth/login').send({ email: 'x@test.dev', password: 'salahsalah' })).status);
  }
  assert.deepEqual(codes, [401, 401, 401, 429, 429]);
});

test('throttling global untuk /api', async () => {
  const limited = await setup({ rateLimit: { max: 2, authMax: 1000 } });
  const t = await register(limited, 'g@test.dev'); // 1 request
  await request(limited).get('/api/auth/me').set(auth(t)); // 2
  const res = await request(limited).get('/api/auth/me').set(auth(t)); // 3 -> diblokir
  assert.equal(res.status, 429);
});
