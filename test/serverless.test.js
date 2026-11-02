const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const http = require('node:http');
const handler = require('../api');

test('handler Vercel: membuat tabel lalu melayani request', async () => {
  const server = http.createServer(handler);
  const health = await request(server).get('/health');
  assert.equal(health.status, 200);
  const reg = await request(server).post('/api/auth/register').send({ name: 'Vercel', email: 'v@test.dev', password: 'password123' });
  assert.equal(reg.status, 201);
  const me = await request(server).get('/api/auth/me').set('Authorization', `Bearer ${reg.body.data.token}`);
  assert.equal(me.body.data.email, 'v@test.dev');
});

test('/docs menyajikan halaman Swagger yang menunjuk ke /openapi.json', async () => {
  const server = http.createServer(handler);
  const docs = await request(server).get('/docs');
  assert.equal(docs.status, 200);
  assert.match(docs.headers['content-type'], /html/);
  assert.match(docs.text, /swagger-ui-bundle\.js/);
  assert.match(docs.text, /\/openapi\.json/);
  const spec = await request(server).get('/openapi.json');
  assert.equal(spec.body.openapi, '3.0.3');
});
