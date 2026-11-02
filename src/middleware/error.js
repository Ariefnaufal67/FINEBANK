const { HttpError } = require('../utils/errors');

function notFoundHandler(req, _res, next) {
  next(new HttpError(404, `Route ${req.method} ${req.originalUrl} tidak ditemukan`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, message: err.message, errors: err.details });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'JSON tidak valid' });
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ success: false, message: 'Data duplikat' });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
}

module.exports = { notFoundHandler, errorHandler };
