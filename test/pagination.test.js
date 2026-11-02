const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePagination, parseSort, buildMeta } = require('../src/utils/pagination');

test('parsePagination: default, batas maksimum, nilai tidak valid', () => {
  assert.deepEqual(parsePagination({}), { page: 1, limit: 10, offset: 0 });
  assert.deepEqual(parsePagination({ page: '3', limit: '5' }), { page: 3, limit: 5, offset: 10 });
  assert.equal(parsePagination({ limit: '9999' }).limit, 100);
  assert.deepEqual(parsePagination({ page: '-2', limit: 'abc' }), { page: 1, limit: 10, offset: 0 });
});

test('parseSort: asc, desc, dan fallback untuk field tidak diizinkan', () => {
  const allowed = ['date', 'amount'];
  const fb = [['date', 'DESC']];
  assert.deepEqual(parseSort('amount', allowed, fb), [['amount', 'ASC']]);
  assert.deepEqual(parseSort('-amount', allowed, fb), [['amount', 'DESC']]);
  assert.equal(parseSort('password', allowed, fb), fb);
  assert.equal(parseSort(undefined, allowed, fb), fb);
});

test('buildMeta menghitung totalPages, hasNext, hasPrev', () => {
  assert.deepEqual(buildMeta({ page: 2, limit: 10 }, 25), { page: 2, limit: 10, total: 25, totalPages: 3, hasNext: true, hasPrev: true });
  assert.deepEqual(buildMeta({ page: 1, limit: 10 }, 0), { page: 1, limit: 10, total: 0, totalPages: 1, hasNext: false, hasPrev: false });
});
