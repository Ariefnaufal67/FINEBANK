class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
module.exports = {
  HttpError,
  badRequest: (m, d) => new HttpError(400, m, d),
  unauthorized: (m = 'Tidak terautentikasi') => new HttpError(401, m),
  forbidden: (m = 'Akses ditolak') => new HttpError(403, m),
  notFound: (m = 'Data tidak ditemukan') => new HttpError(404, m),
  conflict: (m) => new HttpError(409, m),
};
