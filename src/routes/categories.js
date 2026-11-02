const router = require('express').Router();
const { Category } = require('../models');
const validate = require('../middleware/validate');
const { categorySchema } = require('../schemas');
const { notFound, conflict } = require('../utils/errors');

router.get('/', async (req, res) => {
  const data = await Category.findAll({ where: { userId: req.user.id }, order: [['name', 'ASC']] });
  res.json({ success: true, data });
});

router.post('/', validate(categorySchema), async (req, res) => {
  const { name } = req.valid.body;
  if (await Category.findOne({ where: { userId: req.user.id, name } })) throw conflict('Kategori sudah ada');
  const data = await Category.create({ name, userId: req.user.id });
  res.status(201).json({ success: true, data });
});

router.put('/:id', validate(categorySchema), async (req, res) => {
  const cat = await Category.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!cat) throw notFound('Kategori tidak ditemukan');
  await cat.update({ name: req.valid.body.name });
  res.json({ success: true, data: cat });
});

router.delete('/:id', async (req, res) => {
  const cat = await Category.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!cat) throw notFound('Kategori tidak ditemukan');
  await cat.destroy();
  res.status(204).end();
});

module.exports = router;
