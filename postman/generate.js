const fs = require('fs');
const H = [{ key: 'Content-Type', value: 'application/json' }];
const bearer = { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] };
const url = (path, query = []) => ({
  raw: `{{baseUrl}}${path}${query.length ? '?' + query.map((q) => `${q.key}=${q.value}`).join('&') : ''}`,
  host: ['{{baseUrl}}'], path: path.split('/').filter(Boolean), query,
});
const test = (lines) => ({ listen: 'test', script: { type: 'text/javascript', exec: lines } });
const item = (name, method, path, { body, query, auth = true, tests = [] } = {}) => ({
  name,
  event: tests.length ? [test(tests)] : undefined,
  request: {
    method, header: body ? H : [], auth: auth ? bearer : { type: 'noauth' },
    body: body ? { mode: 'raw', raw: JSON.stringify(body, null, 2) } : undefined,
    url: url(path, query),
  },
});
const status = (code) => `pm.test('Status ${code}', () => pm.response.to.have.status(${code}));`;

const collection = {
  info: { name: 'FineBank API', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json', description: 'Jalankan folder berurutan: Auth -> Categories -> Expenses -> Bills.' },
  variable: [{ key: 'baseUrl', value: 'http://localhost:3000' }, { key: 'token', value: '' }, { key: 'expenseId', value: '' }, { key: 'billId', value: '' }, { key: 'categoryId', value: '' }],
  item: [
    { name: '1. Auth', item: [
      item('Register', 'POST', '/api/auth/register', { auth: false, body: { name: 'Tester Postman', email: 'postman{{$timestamp}}@test.dev', password: 'password123' }, tests: [status(201), "pm.collectionVariables.set('token', pm.response.json().data.token);"] }),
      item('Register - validasi gagal', 'POST', '/api/auth/register', { auth: false, body: { name: 'A', email: 'bukan-email', password: '123' }, tests: [status(400)] }),
      item('Login (seed: arief@finebank.test)', 'POST', '/api/auth/login', { auth: false, body: { email: 'arief@finebank.test', password: 'password123' }, tests: [status(200), "pm.collectionVariables.set('token', pm.response.json().data.token);"] }),
      item('Me', 'GET', '/api/auth/me', { tests: [status(200)] }),
    ] },
    { name: '2. Categories', item: [
      item('Buat kategori', 'POST', '/api/categories', { body: { name: 'Hiburan {{$timestamp}}' }, tests: [status(201), "pm.collectionVariables.set('categoryId', pm.response.json().data.id);"] }),
      item('Daftar kategori', 'GET', '/api/categories', { tests: [status(200)] }),
    ] },
    { name: '3. Expenses', item: [
      item('Buat expense', 'POST', '/api/expenses', { body: { title: 'Nonton bioskop', amount: 55000, date: '2026-10-25', categoryId: '{{categoryId}}' }, tests: [status(201), "pm.collectionVariables.set('expenseId', pm.response.json().data.id);"] }),
      item('List + pagination', 'GET', '/api/expenses', { query: [{ key: 'page', value: '1' }, { key: 'limit', value: '5' }], tests: [status(200), "pm.test('ada meta', () => pm.expect(pm.response.json().meta).to.have.property('totalPages'));"] }),
      item('Filter (q, nominal, tanggal, sort)', 'GET', '/api/expenses', { query: [{ key: 'q', value: 'nonton' }, { key: 'minAmount', value: '10000' }, { key: 'from', value: '2026-10-01' }, { key: 'sort', value: '-amount' }], tests: [status(200)] }),
      item('Detail', 'GET', '/api/expenses/{{expenseId}}', { tests: [status(200)] }),
      item('Update', 'PUT', '/api/expenses/{{expenseId}}', { body: { amount: 60000 }, tests: [status(200), "pm.test('amount berubah', () => pm.expect(pm.response.json().data.amount).to.eql(60000));"] }),
      item('Summary', 'GET', '/api/expenses/summary', { tests: [status(200)] }),
      item('Tanpa token (401)', 'GET', '/api/expenses', { auth: false, tests: [status(401)] }),
      item('Hapus', 'DELETE', '/api/expenses/{{expenseId}}', { tests: [status(204)] }),
    ] },
    { name: '4. Bills', item: [
      item('Buat bill', 'POST', '/api/bills', { body: { name: 'Netflix', amount: 54000, dueDate: '2026-11-10' }, tests: [status(201), "pm.collectionVariables.set('billId', pm.response.json().data.id);"] }),
      item('List unpaid', 'GET', '/api/bills', { query: [{ key: 'status', value: 'unpaid' }, { key: 'limit', value: '10' }], tests: [status(200)] }),
      item('List overdue', 'GET', '/api/bills', { query: [{ key: 'status', value: 'overdue' }], tests: [status(200)] }),
      item('Bayar', 'POST', '/api/bills/{{billId}}/pay', { tests: [status(200), "pm.test('paid', () => pm.expect(pm.response.json().data.status).to.eql('paid'));"] }),
      item('Hapus', 'DELETE', '/api/bills/{{billId}}', { tests: [status(204)] }),
    ] },
    { name: '5. Admin & Throttling', item: [
      item('Users (butuh token admin -> 403 untuk user biasa)', 'GET', '/api/users', { tests: ["pm.test('403 atau 200', () => pm.expect([200, 403]).to.include(pm.response.code));"] }),
    ] },
  ],
};
fs.writeFileSync('postman/FineBank.postman_collection.json', JSON.stringify(collection, null, 2));
console.log('ok');
