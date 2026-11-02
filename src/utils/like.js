const { Op } = require('sequelize');
const sequelize = require('../db');

// PostgreSQL: LIKE peka huruf besar/kecil, jadi pakai ILIKE agar sama dengan SQLite.
const likeOp = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
module.exports = { likeOp, contains: (v) => ({ [likeOp]: `%${v}%` }) };
