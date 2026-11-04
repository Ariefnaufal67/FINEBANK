const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const { sequelize } = require('./helpers');
const migrator = require('../src/migrator');

const columns = async (t) => {
  const d = await sequelize.getQueryInterface().describeTable(t);
  return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, { type: v.type.replace(/\(.*\)/, ''), allowNull: v.allowNull }]));
};
const indexes = async (t) => (await sequelize.getQueryInterface().showIndex(t)).map((i) => i.name).filter((n) => !n.startsWith('sqlite_')).sort();
const TABLES = ['users', 'categories', 'expenses', 'bills'];

before(async () => { await sequelize.getQueryInterface().dropAllTables(); });

test('migrate up membuat skema yang sama dengan model (kolom dan index)', async () => {
  // skema acuan dari model
  await sequelize.sync({ force: true });
  const expected = {};
  for (const t of TABLES) expected[t] = { cols: await columns(t), idx: await indexes(t) };
  await sequelize.getQueryInterface().dropAllTables();

  const ran = await migrator.up();
  assert.equal(ran.length, 4);
  for (const t of TABLES) {
    assert.deepEqual(Object.keys(await columns(t)).sort(), Object.keys(expected[t].cols).sort(), `kolom ${t}`);
    assert.deepEqual(await columns(t), expected[t].cols, `tipe kolom ${t}`);
    assert.deepEqual(await indexes(t), expected[t].idx, `index ${t}`);
  }
});

test('migrate up kedua kali tidak melakukan apa-apa, status semua up', async () => {
  assert.deepEqual(await migrator.up(), []);
  assert.ok((await migrator.status()).every((m) => m.applied));
});

test('migrate down membatalkan migrasi terakhir lalu up memasangnya lagi', async () => {
  assert.deepEqual((await migrator.down(1)).length, 1);
  const tables = (await sequelize.getQueryInterface().showAllTables()).map((t) => (typeof t === 'string' ? t : t.tableName));
  assert.ok(!tables.includes('bills'));
  assert.deepEqual((await migrator.up()).length, 1);
});

test('migrate up aman pada database yang tabelnya sudah dibuat lewat sync() (mis. Neon/Vercel)', async () => {
  await sequelize.getQueryInterface().dropAllTables();
  await sequelize.sync({ force: true });
  const ran = await migrator.up();
  assert.equal(ran.length, 4);
  assert.ok((await migrator.status()).every((m) => m.applied));
});
