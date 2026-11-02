require('dotenv').config({ quiet: true });

const isTest = process.env.NODE_ENV === 'test';

module.exports = {
  env: process.env.NODE_ENV || 'development',
  isTest,
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL || '',
  sqlitePath: process.env.SQLITE_PATH || './data/finebank.sqlite',
  jwtSecret: process.env.JWT_SECRET || (isTest ? 'test-secret' : 'dev-only-secret-ganti-di-produksi'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    authMax: Number(process.env.RATE_LIMIT_AUTH_MAX) || 10,
  },
};
