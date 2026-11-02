const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'user'), allowNull: false, defaultValue: 'user' },
}, {
  tableName: 'users',
  defaultScope: { attributes: { exclude: ['passwordHash'] } },
  scopes: { withPassword: {} },
});

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(60), allowNull: false },
}, {
  tableName: 'categories',
  indexes: [{ unique: true, fields: ['userId', 'name'] }],
});

const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(120), allowNull: false },
  amount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    get() { const v = this.getDataValue('amount'); return v === null ? v : Number(v); },
  },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  note: { type: DataTypes.TEXT },
}, {
  tableName: 'expenses',
  indexes: [{ fields: ['userId', 'date'] }, { fields: ['categoryId'] }],
});

const Bill = sequelize.define('Bill', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  amount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    get() { const v = this.getDataValue('amount'); return v === null ? v : Number(v); },
  },
  dueDate: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM('unpaid', 'paid'), allowNull: false, defaultValue: 'unpaid' },
  paidAt: { type: DataTypes.DATE },
}, {
  tableName: 'bills',
  indexes: [{ fields: ['userId', 'dueDate'] }, { fields: ['status'] }],
});

// Relasi
User.hasMany(Category, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'CASCADE' });
Category.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Expense, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'CASCADE' });
Expense.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

Category.hasMany(Expense, { foreignKey: { name: 'categoryId', allowNull: true }, onDelete: 'SET NULL' });
Expense.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(Bill, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'CASCADE' });
Bill.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

module.exports = { sequelize, User, Category, Expense, Bill };
