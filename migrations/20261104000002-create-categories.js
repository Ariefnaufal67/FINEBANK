'use strict';
const { createTableIfMissing, addIndexIfMissing } = require('../src/utils/migrate-helpers');
module.exports = {
  async up(queryInterface, Sequelize) {
    await createTableIfMissing(queryInterface, 'categories', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(60), allowNull: false },
      userId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await addIndexIfMissing(queryInterface, 'categories', ['userId', 'name'], { unique: true, name: 'categories_user_id_name' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('categories', {});
  },
};
