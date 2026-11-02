const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('./config');

function createSequelize() {
  // Produksi (Railway/Render): PostgreSQL lewat DATABASE_URL
  if (config.databaseUrl) {
    // Neon/Supabase mewajibkan SSL; aktif otomatis jika URL memuat sslmode=require.
    const useSsl = process.env.DATABASE_SSL === 'true' || /sslmode=require/.test(config.databaseUrl);
    return new Sequelize(config.databaseUrl, {
      dialect: 'postgres',
      dialectModule: require('pg'), // eksplisit agar ikut ter-bundle di Vercel
      logging: false,
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
  return new Sequelize({ dialect: 'sqlite', storage, logging: false });
}

module.exports = createSequelize();
