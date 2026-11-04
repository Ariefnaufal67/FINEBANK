// Profiling query ORM + request (setara Django Silk): mencatat SQL yang dihasilkan Sequelize,
// waktu eksekusinya, serta jumlah query dan lama tiap request.
// Aktif secara default (kecuali NODE_ENV=test); matikan dengan DB_PROFILING=false.
const { AsyncLocalStorage } = require('node:async_hooks');
const config = require('../config');

const als = new AsyncLocalStorage();
const TOP = 5;
const MAX_REQUESTS = 500;

const stats = { queries: 0, totalMs: 0, slow: 0, slowest: [] };
let requests = []; // ring buffer request terakhir

const round = (n) => Math.round(n * 100) / 100;
// /api/expenses/12 -> /api/expenses/:id (agar request sejenis dikelompokkan)
const normalize = (url) => url.split('?')[0].replace(/\/\d+(?=\/|$)/g, '/:id');

function top(list, key, n = TOP) {
  return [...list].sort((a, b) => b[key] - a[key]).slice(0, n);
}

const profiler = {
  enabled: config.dbProfiling,
  slowMs: config.slowQueryMs,

  // Dipasang sebagai opsi `logging` Sequelize (dengan benchmark: true, argumen ke-2 = ms).
  log(sql, ms) {
    if (!profiler.enabled) return;
    const text = String(sql).replace(/^Executed \([^)]*\): /, '');
    const time = typeof ms === 'number' ? ms : 0;
    stats.queries += 1;
    stats.totalMs += time;
    const entry = { sql: text.slice(0, 300), ms: time };
    if (time >= profiler.slowMs) {
      stats.slow += 1;
      console.warn(`[db:lambat] ${time}ms ${entry.sql}`);
    }
    stats.slowest.push(entry);
    stats.slowest.sort((a, b) => b.ms - a.ms);
    stats.slowest.length = Math.min(stats.slowest.length, TOP);
    const req = als.getStore();
    if (req) { req.count += 1; req.totalMs += time; req.queries.push(entry); }
  },

  // Middleware: hitung query per request, kirim sebagai header, dan simpan ke riwayat request.
  middleware(req, res, next) {
    if (!profiler.enabled) return next();
    const store = { count: 0, totalMs: 0, queries: [] };
    const started = process.hrtime.bigint();
    const writeHead = res.writeHead;
    res.writeHead = function (...args) {
      if (!res.headersSent) {
        res.setHeader('X-DB-Query-Count', store.count);
        res.setHeader('X-DB-Time-Ms', round(store.totalMs));
      }
      return writeHead.apply(this, args);
    };
    res.on('finish', () => {
      const path = normalize(req.originalUrl);
      if (store.count > 10) console.warn(`[db:n+1?] ${req.method} ${path} menjalankan ${store.count} query`);
      if (path.startsWith('/api/profiling')) return; // dashboard tidak memprofil dirinya sendiri
      requests.push({
        at: new Date().toISOString(), method: req.method, path, status: res.statusCode,
        ms: round(Number(process.hrtime.bigint() - started) / 1e6),
        queries: store.count, dbMs: round(store.totalMs),
      });
      if (requests.length > MAX_REQUESTS) requests = requests.slice(-MAX_REQUESTS);
    });
    als.run(store, next);
  },

  snapshot() {
    const n = requests.length;
    const sum = (k) => requests.reduce((a, r) => a + r[k], 0);
    return {
      enabled: profiler.enabled,
      slowThresholdMs: profiler.slowMs,
      queries: stats.queries,
      totalMs: round(stats.totalMs),
      avgMs: stats.queries ? round(stats.totalMs / stats.queries) : 0,
      slowQueries: stats.slow,
      slowest: stats.slowest,
      summary: {
        requests: n,
        avgMs: n ? round(sum('ms') / n) : 0,
        avgQueries: n ? round(sum('queries') / n) : 0,
        avgDbMs: n ? round(sum('dbMs') / n) : 0,
      },
      mostTime: top(requests, 'ms'),
      mostQueries: top(requests, 'queries'),
      mostDbTime: top(requests, 'dbMs'),
    };
  },

  reset() { stats.queries = 0; stats.totalMs = 0; stats.slow = 0; stats.slowest = []; requests = []; },
};

module.exports = profiler;
