const config = require('./config');
const { sequelize } = require('./models');
const createApp = require('./app');

async function main() {
  await sequelize.authenticate();
  await sequelize.sync(); // buat tabel jika belum ada
  createApp().listen(config.port, () => console.log(`FineBank API berjalan di port ${config.port}`));
}

main().catch((e) => { console.error('Gagal start:', e); process.exit(1); });
