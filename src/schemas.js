const { z } = require('zod');

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');
const amount = z.coerce.number().positive('Nominal harus lebih dari 0').max(1e12);

exports.registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password minimal 8 karakter').max(72),
});
exports.loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

exports.categorySchema = z.object({ name: z.string().trim().min(1).max(60) });

exports.expenseCreate = z.object({
  title: z.string().trim().min(1).max(120),
  amount,
  date: dateStr,
  note: z.string().max(1000).optional(),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
});
exports.expenseUpdate = exports.expenseCreate.partial();

exports.billCreate = z.object({
  name: z.string().trim().min(1).max(120),
  amount,
  dueDate: dateStr,
});
exports.billUpdate = exports.billCreate.partial().extend({ status: z.enum(['unpaid', 'paid']).optional() });

exports.expenseQuery = z.object({
  page: z.string().optional(), limit: z.string().optional(), sort: z.string().optional(),
  q: z.string().max(100).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  from: dateStr.optional(), to: dateStr.optional(),
});
exports.billQuery = z.object({
  page: z.string().optional(), limit: z.string().optional(), sort: z.string().optional(),
  q: z.string().max(100).optional(),
  status: z.enum(['unpaid', 'paid', 'overdue']).optional(),
  from: dateStr.optional(), to: dateStr.optional(),
});
