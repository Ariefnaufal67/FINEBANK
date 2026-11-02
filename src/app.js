const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const openapi = require('./openapi');
const { authenticate, requireRole } = require('./middleware/auth');
const { notFoundHandler, errorHandler } = require('./middleware/error');


// Swagger UI dimuat dari CDN agar tidak bergantung pada file di node_modules (serverless Vercel).
const swaggerHtml = `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>FineBank API - Docs</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.34.1/swagger-ui.css">
</head><body><div id="swagger-ui"></div>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.34.1/swagger-ui-bundle.js"></script>
<script>window.onload = function () { window.ui = SwaggerUIBundle({ url: '/openapi.json', dom_id: '#swagger-ui', persistAuthorization: true }); };</script>
</body></html>`;

function createApp(opts = {}) {
  const rl = { ...config.rateLimit, ...(opts.rateLimit || {}) };
  const app = express();
  app.set('trust proxy', 1); // di belakang proxy Railway/Render
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',') }));
  app.use(express.json({ limit: '100kb' }));
  if (!config.isTest) app.use(morgan('tiny'));

  const limiterBase = {
    windowMs: rl.windowMs,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ success: false, message: 'Terlalu banyak request, coba lagi nanti' }),
  };
  const globalLimiter = rateLimit({ ...limiterBase, limit: rl.max });
  const authLimiter = rateLimit({ ...limiterBase, limit: rl.authMax });

  app.get('/', (_req, res) => res.json({ name: 'FineBank API', docs: '/docs', health: '/health' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
  app.get('/docs', (_req, res) => res.type('html').send(swaggerHtml));
  app.get('/openapi.json', (_req, res) => res.json(openapi));

  app.use('/api', globalLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/categories', authenticate, require('./routes/categories'));
  app.use('/api/expenses', authenticate, require('./routes/expenses'));
  app.use('/api/bills', authenticate, require('./routes/bills'));
  app.use('/api/users', authenticate, requireRole('admin'), require('./routes/users'));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
