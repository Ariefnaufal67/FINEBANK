// Runner migrasi ringan, kompatibel dengan format sequelize-cli (tabel SequelizeMeta, file { up, down }).
const fs = require('fs');
const path = require('path');
const { Sequelize, QueryTypes } = require('sequelize');
const { sequelize } = require('./models');

const DIR = path.join(__dirname, '..', 'migrations');
const META = 'SequelizeMeta';

const files = () => fs.readdirSync(DIR).filter((f) => f.endsWith('.js')).sort();

async function applied() {
  const qi = sequelize.getQueryInterface();
  const tables = (await qi.showAllTables()).map((t) => (typeof t === 'string' ? t : t.tableName));
  if (!tables.includes(META)) await qi.createTable(META, { name: { type: Sequelize.STRING, allowNull: false, primaryKey: true } });
  const rows = await sequelize.query(`SELECT name FROM "${META}" ORDER BY name`, { type: QueryTypes.SELECT });
  return rows.map((r) => r.name);
}

async function up() {
  const done = new Set(await applied());
  const ran = [];
  for (const f of files()) {
    if (done.has(f)) continue;
    await require(path.join(DIR, f)).up(sequelize.getQueryInterface(), Sequelize);
    await sequelize.query(`INSERT INTO "${META}" (name) VALUES (?)`, { replacements: [f] });
    ran.push(f);
  }
  return ran;
}

// Batalkan `steps` migrasi terakhir (default 1).
async function down(steps = 1) {
  const done = await applied();
  const undone = [];
  for (const f of done.slice().reverse().slice(0, steps)) {
    await require(path.join(DIR, f)).down(sequelize.getQueryInterface(), Sequelize);
    await sequelize.query(`DELETE FROM "${META}" WHERE name = ?`, { replacements: [f] });
    undone.push(f);
  }
  return undone;
}

async function status() {
  const done = new Set(await applied());
  return files().map((f) => ({ name: f, applied: done.has(f) }));
}

module.exports = { up, down, status };
