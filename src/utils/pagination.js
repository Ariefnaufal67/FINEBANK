// Parsing page/limit/sort dan pembentukan meta pagination.
function parsePagination(query, { defaultLimit = 10, maxLimit = 100 } = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, offset: (page - 1) * limit };
}

function parseSort(sort, allowed, fallback) {
  // contoh: sort=-amount  (desc) atau sort=date (asc)
  if (!sort || typeof sort !== 'string') return fallback;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  if (!allowed.includes(field)) return fallback;
  return [[field, desc ? 'DESC' : 'ASC']];
}

function buildMeta({ page, limit }, total) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}

module.exports = { parsePagination, parseSort, buildMeta };
