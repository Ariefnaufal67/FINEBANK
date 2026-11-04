const path = require('path');
const { sequelize } = require('../src/models');
const { importCsv } = require('../src/importer');

(async () => {
  const dir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', 'csv_data');
  await sequelize.authenticate();
  await sequelize.sync();
  const r = await importCsv(dir);
  console.log(`Import selesai dari ${dir}`);
  console.log(`  users: +${r.users}, categories: +${r.categories}, expenses: +${r.expenses}, bills: +${r.bills}, dilewati: ${r.skipped}`);
  await sequelize.close();
})().catch((e) => { console.error('Import gagal:', e.message); process.exit(1); });
