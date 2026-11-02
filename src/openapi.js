const ok = { description: 'Berhasil' };
const sec = [{ bearerAuth: [] }];
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer' } };
const q = (name, type = 'string', description = '') => ({ name, in: 'query', schema: { type }, description });
const paging = [q('page', 'integer', 'Halaman (default 1)'), q('limit', 'integer', 'Item per halaman (default 10, maks 100)'), q('sort', 'string', 'Contoh: -amount (desc) / date (asc)')];
const body = (props, required) => ({ required: true, content: { 'application/json': { schema: { type: 'object', required, properties: props } } } });

module.exports = {
  openapi: '3.0.3',
  info: { title: 'FineBank API', version: '1.0.0', description: 'Backend REST API untuk FineBank Admin UI: auth JWT, expenses, bills, kategori.' },
  servers: [{ url: '/' }],
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths: {
    '/api/auth/register': { post: { tags: ['Auth'], summary: 'Registrasi user', requestBody: body({ name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string', minLength: 8 } }, ['name', 'email', 'password']), responses: { 201: ok, 400: { description: 'Validasi gagal' }, 409: { description: 'Email sudah terdaftar' } } } },
    '/api/auth/login': { post: { tags: ['Auth'], summary: 'Login, mengembalikan JWT', requestBody: body({ email: { type: 'string' }, password: { type: 'string' } }, ['email', 'password']), responses: { 200: ok, 401: { description: 'Kredensial salah' }, 429: { description: 'Terlalu banyak percobaan' } } } },
    '/api/auth/me': { get: { tags: ['Auth'], summary: 'Profil user login', security: sec, responses: { 200: ok, 401: { description: 'Token tidak valid' } } } },
    '/api/categories': {
      get: { tags: ['Categories'], summary: 'Daftar kategori', security: sec, responses: { 200: ok } },
      post: { tags: ['Categories'], summary: 'Buat kategori', security: sec, requestBody: body({ name: { type: 'string' } }, ['name']), responses: { 201: ok, 409: { description: 'Duplikat' } } },
    },
    '/api/categories/{id}': {
      put: { tags: ['Categories'], summary: 'Ubah kategori', security: sec, parameters: [idParam], requestBody: body({ name: { type: 'string' } }, ['name']), responses: { 200: ok, 404: { description: 'Tidak ditemukan' } } },
      delete: { tags: ['Categories'], summary: 'Hapus kategori', security: sec, parameters: [idParam], responses: { 204: { description: 'Terhapus' }, 404: { description: 'Tidak ditemukan' } } },
    },
    '/api/expenses': {
      get: { tags: ['Expenses'], summary: 'Daftar expense (pagination, filter, sort)', security: sec, parameters: [...paging, q('q', 'string', 'Cari pada title'), q('categoryId', 'integer'), q('minAmount', 'number'), q('maxAmount', 'number'), q('from', 'string', 'YYYY-MM-DD'), q('to', 'string', 'YYYY-MM-DD')], responses: { 200: ok } },
      post: { tags: ['Expenses'], summary: 'Tambah expense', security: sec, requestBody: body({ title: { type: 'string' }, amount: { type: 'number' }, date: { type: 'string', example: '2026-10-28' }, note: { type: 'string' }, categoryId: { type: 'integer' } }, ['title', 'amount', 'date']), responses: { 201: ok, 400: { description: 'Validasi gagal' } } },
    },
    '/api/expenses/summary': { get: { tags: ['Expenses'], summary: 'Total & ringkasan per kategori', security: sec, responses: { 200: ok } } },
    '/api/expenses/{id}': {
      get: { tags: ['Expenses'], summary: 'Detail expense', security: sec, parameters: [idParam], responses: { 200: ok, 404: { description: 'Tidak ditemukan' } } },
      put: { tags: ['Expenses'], summary: 'Ubah expense', security: sec, parameters: [idParam], requestBody: body({ title: { type: 'string' }, amount: { type: 'number' }, date: { type: 'string' }, note: { type: 'string' }, categoryId: { type: 'integer' } }, []), responses: { 200: ok, 404: { description: 'Tidak ditemukan' } } },
      delete: { tags: ['Expenses'], summary: 'Hapus expense', security: sec, parameters: [idParam], responses: { 204: { description: 'Terhapus' } } },
    },
    '/api/bills': {
      get: { tags: ['Bills'], summary: 'Daftar bill (pagination, filter, sort)', security: sec, parameters: [...paging, q('q', 'string'), q('status', 'string', 'unpaid | paid | overdue'), q('from', 'string'), q('to', 'string')], responses: { 200: ok } },
      post: { tags: ['Bills'], summary: 'Tambah bill', security: sec, requestBody: body({ name: { type: 'string' }, amount: { type: 'number' }, dueDate: { type: 'string', example: '2026-11-05' } }, ['name', 'amount', 'dueDate']), responses: { 201: ok } },
    },
    '/api/bills/{id}': {
      get: { tags: ['Bills'], summary: 'Detail bill', security: sec, parameters: [idParam], responses: { 200: ok, 404: { description: 'Tidak ditemukan' } } },
      put: { tags: ['Bills'], summary: 'Ubah bill', security: sec, parameters: [idParam], requestBody: body({ name: { type: 'string' }, amount: { type: 'number' }, dueDate: { type: 'string' }, status: { type: 'string', enum: ['unpaid', 'paid'] } }, []), responses: { 200: ok } },
      delete: { tags: ['Bills'], summary: 'Hapus bill', security: sec, parameters: [idParam], responses: { 204: { description: 'Terhapus' } } },
    },
    '/api/bills/{id}/pay': { post: { tags: ['Bills'], summary: 'Tandai bill lunas', security: sec, parameters: [idParam], responses: { 200: ok } } },
    '/api/users': { get: { tags: ['Users (admin)'], summary: 'Daftar user (khusus admin)', security: sec, parameters: [...paging, q('q'), q('role')], responses: { 200: ok, 403: { description: 'Bukan admin' } } } },
    '/api/users/{id}': { delete: { tags: ['Users (admin)'], summary: 'Hapus user (khusus admin)', security: sec, parameters: [idParam], responses: { 204: { description: 'Terhapus' }, 403: { description: 'Bukan admin' } } } },
    '/health': { get: { tags: ['System'], summary: 'Health check', responses: { 200: ok } } },
  },
};
