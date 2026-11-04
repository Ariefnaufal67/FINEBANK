// Import data massal dari file CSV (setara importer.py di materi ORM).
// Idempotent: baris yang sudah ada dilewati; insert memakai bulkCreate (1 query per tabel, bukan per baris).
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Category, Expense, Bill } = require('./models');

// Parser CSV sederhana: mendukung kutip ganda dan koma di dalam kutip.
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  const push = () => { row.push(cell); cell = ''; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') push();
    else if (c === '\n') { push(); rows.push(row); row = []; }
    else if (c !== '\r') cell += c;
  }
  if (cell !== '' || row.length) { push(); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim() !== ''));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

const read = (dir, file) => {
  const p = path.join(dir, file);
  return fs.existsSync(p) ? parseCsv(fs.readFileSync(p, 'utf8')) : [];
};

async function importCsv(dir = path.join(__dirname, '..', 'csv_data'), { bcryptRounds = 10 } = {}) {
  const result = { users: 0, categories: 0, expenses: 0, bills: 0, skipped: 0 };

  // 1. users
  const userRows = read(dir, 'users.csv').filter((r) => r.email && r.password);
  const known = new Set((await User.findAll({ where: { email: userRows.map((r) => r.email) }, attributes: ['email'] })).map((u) => u.email));
  const fresh = userRows.filter((r) => !known.has(r.email));
  if (fresh.length) {
    await User.bulkCreate(await Promise.all(fresh.map(async (r) => ({
      name: r.name, email: r.email, passwordHash: await bcrypt.hash(r.password, bcryptRounds), role: r.role === 'admin' ? 'admin' : 'user',
    }))));
  }
  result.users = fresh.length;

  const emails = [...new Set([...userRows.map((r) => r.email)])];
  const idByEmail = new Map((await User.findAll({ where: { email: { [Op.in]: emails } }, attributes: ['id', 'email'] })).map((u) => [u.email, u.id]));
  const userIds = [...idByEmail.values()];

  // 2. categories
  const catRows = read(dir, 'categories.csv');
  const catKey = (uid, name) => `${uid}|${name}`;
  const catMap = new Map((await Category.findAll({ where: { userId: userIds }, attributes: ['id', 'userId', 'name'] })).map((c) => [catKey(c.userId, c.name), c.id]));
  const newCats = [];
  for (const r of catRows) {
    const uid = idByEmail.get(r.userEmail);
    if (!uid) { result.skipped++; continue; }
    if (!catMap.has(catKey(uid, r.name)) && !newCats.some((c) => c.userId === uid && c.name === r.name)) newCats.push({ userId: uid, name: r.name });
  }
  if (newCats.length) await Category.bulkCreate(newCats);
  result.categories = newCats.length;
  const allCats = new Map((await Category.findAll({ where: { userId: userIds }, attributes: ['id', 'userId', 'name'] })).map((c) => [catKey(c.userId, c.name), c.id]));

  // 3. expenses
  const expRows = read(dir, 'expenses.csv');
  const expKey = (uid, title, date, amount) => `${uid}|${title}|${date}|${Number(amount)}`;
  const haveExp = new Set((await Expense.findAll({ where: { userId: userIds }, attributes: ['userId', 'title', 'date', 'amount'] })).map((e) => expKey(e.userId, e.title, e.date, e.amount)));
  const newExp = [];
  for (const r of expRows) {
    const uid = idByEmail.get(r.userEmail);
    if (!uid || !r.title || Number.isNaN(Number(r.amount))) { result.skipped++; continue; }
    const key = expKey(uid, r.title, r.date, r.amount);
    if (haveExp.has(key)) continue;
    haveExp.add(key);
    newExp.push({ userId: uid, categoryId: allCats.get(catKey(uid, r.category)) ?? null, title: r.title, amount: Number(r.amount), date: r.date, note: r.note || null });
  }
  if (newExp.length) await Expense.bulkCreate(newExp);
  result.expenses = newExp.length;

  // 4. bills
  const billRows = read(dir, 'bills.csv');
  const billKey = (uid, name, due) => `${uid}|${name}|${due}`;
  const haveBill = new Set((await Bill.findAll({ where: { userId: userIds }, attributes: ['userId', 'name', 'dueDate'] })).map((b) => billKey(b.userId, b.name, b.dueDate)));
  const newBills = [];
  for (const r of billRows) {
    const uid = idByEmail.get(r.userEmail);
    if (!uid || !r.name || Number.isNaN(Number(r.amount))) { result.skipped++; continue; }
    const key = billKey(uid, r.name, r.dueDate);
    if (haveBill.has(key)) continue;
    haveBill.add(key);
    const paid = r.status === 'paid';
    newBills.push({ userId: uid, name: r.name, amount: Number(r.amount), dueDate: r.dueDate, status: paid ? 'paid' : 'unpaid', paidAt: paid ? new Date(r.dueDate) : null });
  }
  if (newBills.length) await Bill.bulkCreate(newBills);
  result.bills = newBills.length;

  return result;
}

module.exports = { importCsv, parseCsv };
