// Bantuan agar migrasi aman dijalankan pada database yang tabelnya sudah dibuat lewat sync().
const names = async (qi) => (await qi.showAllTables()).map((t) => (typeof t === 'string' ? t : t.tableName));
const tableExists = async (qi, table) => (await names(qi)).includes(table);
const hasIndex = async (qi, table, name) => (await qi.showIndex(table)).some((i) => i.name === name);

// createTable hanya jika belum ada
async function createTableIfMissing(qi, table, columns) {
  if (await tableExists(qi, table)) return false;
  await qi.createTable(table, columns);
  return true;
}
// addIndex hanya jika belum ada
async function addIndexIfMissing(qi, table, fields, options) {
  if (await hasIndex(qi, table, options.name)) return;
  await qi.addIndex(table, fields, options);
}
module.exports = { tableExists, hasIndex, createTableIfMissing, addIndexIfMissing };
