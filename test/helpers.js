const request = require('supertest');
const bcrypt = require('bcryptjs');
const createApp = require('../src/app');
const { sequelize, User } = require('../src/models');

async function setup(opts) {
  await sequelize.sync({ force: true });
  return createApp(opts);
}
async function register(app, email, name = 'Tester') {
  const res = await request(app).post('/api/auth/register').send({ name, email, password: 'password123' });
  return res.body.data.token;
}
async function makeAdmin(app, email = 'admin@test.dev') {
  await User.create({ name: 'Admin', email, passwordHash: await bcrypt.hash('password123', 4), role: 'admin' });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
  return res.body.data.token;
}
const auth = (t) => ({ Authorization: `Bearer ${t}` });
module.exports = { request, setup, register, makeAdmin, auth, sequelize };
