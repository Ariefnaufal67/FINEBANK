// Pemakaian: npm run migrate | npm run migrate:undo [jumlah] | npm run migrate:status
const migrator = require('../src/migrator');
const { sequelize } = require('../src/models');

(async () => {
  const cmd = process.argv[2] || 'up';
  await sequelize.authenticate();
  if (cmd === 'up') {
    const ran = await migrator.up();
    console.log(ran.length ? ran.map((f) => `  migrated: ${f}`).join('\n') : 'Tidak ada migrasi baru (sudah up to date).');
  } else if (cmd === 'down') {
    const undone = await migrator.down(Number(process.argv[3]) || 1);
    console.log(undone.length ? undone.map((f) => `  reverted: ${f}`).join('\n') : 'Tidak ada migrasi untuk dibatalkan.');
  } else if (cmd === 'status') {
    (await migrator.status()).forEach((m) => console.log(`${m.applied ? 'up  ' : 'down'}  ${m.name}`));
  } else {
    console.error('Perintah tidak dikenal. Gunakan: up | down [n] | status');
    process.exitCode = 1;
  }
  await sequelize.close();
})().catch((e) => { console.error('Migrasi gagal:', e.message); process.exit(1); });
