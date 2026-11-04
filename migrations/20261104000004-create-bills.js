'use strict';
const { createTableIfMissing, addIndexIfMissing } = require('../src/utils/migrate-helpers');
module.exports = {
  async up(queryInterface, Sequelize) {
    await createTableIfMissing(queryInterface, 'bills', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: false },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      dueDate: { type: Sequelize.DATEONLY, allowNull: false },
      status: { type: Sequelize.ENUM('unpaid', 'paid'), allowNull: false, defaultValue: 'unpaid' },
      paidAt: { type: Sequelize.DATE },
      userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await addIndexIfMissing(queryInterface, 'bills', ['userId', 'dueDate'], { name: 'bills_user_id_due_date' });
    await addIndexIfMissing(queryInterface, 'bills', ['status'], { name: 'bills_status' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('bills', {});
    if (queryInterface.sequelize.getDialect() === 'postgres') await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_bills_status"');
  },
};
