const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('./config');
const profiler = require('./utils/profiler');

// Profiling ORM: log + waktu eksekusi tiap query; aktif jika DB_PROFILING=true.
const profiling = { logging: (sql, ms) => profiler.log(sql, ms), benchmark: true };

function createSequelize() {
  // Produksi: PostgreSQL lewat DATABASE_URL. Mode test SELALU memakai SQLite in-memory,
  // supaya test (yang mengosongkan tabel) tidak pernah menyentuh database sungguhan.
  if (config.databaseUrl && !config.isTest) {
    // Neon/Supabase mewajibkan SSL; aktif otomatis jika URL memuat sslmode=require.
    const useSsl = process.env.DATABASE_SSL === 'true' || /sslmode=require/.test(config.databaseUrl);
    return new Sequelize(config.databaseUrl, {
      dialect: 'postgres',
      dialectModule: require('pg'), // eksplisit agar ikut ter-bundle di Vercel
      ...profiling,
      pool: { max: 3, idle: 10000 }, // serverless: koneksi kecil
      dialectOptions: useSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
    });
  }
  // Test: SQLite in-memory. Dev: SQLite file.
  let storage = ':memory:';
  if (!config.isTest) {
    storage = path.resolve(config.sqlitePath);
    fs.mkdirSync(path.dirname(storage), { recursive: true });
  }
  return new Sequelize({ dialect: 'sqlite', storage, ...profiling });
}

module.exports = createSequelize();
