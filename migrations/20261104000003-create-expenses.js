'use strict';
const { createTableIfMissing, addIndexIfMissing } = require('../src/utils/migrate-helpers');
module.exports = {
  async up(queryInterface, Sequelize) {
    await createTableIfMissing(queryInterface, 'expenses', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      title: { type: Sequelize.STRING(120), allowNull: false },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      note: { type: Sequelize.TEXT },
      userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      categoryId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'categories', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    // Index untuk filter/sort yang paling sering dipakai (lihat optimasi ORM)
    await addIndexIfMissing(queryInterface, 'expenses', ['userId', 'date'], { name: 'expenses_user_id_date' });
    await addIndexIfMissing(queryInterface, 'expenses', ['categoryId'], { name: 'expenses_category_id' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('expenses', {});
  },
};
