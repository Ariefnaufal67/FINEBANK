// Entry point serverless untuk Vercel: semua request diarahkan ke app Express.
const createApp = require('../src/app');
const { sequelize } = require('../src/models');

const app = createApp();
let ready = null; // tabel dibuat sekali per cold start

module.exports = async (req, res) => {
  try {
    ready = ready || sequelize.sync();
    await ready;
  } catch (err) {
    ready = null;
    console.error('Gagal menyiapkan database:', err.message);
    return res.status(500).json({ success: false, message: 'Database tidak dapat diakses' });
  }
  return app(req, res);
};
