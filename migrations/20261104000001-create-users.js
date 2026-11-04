'use strict';
const { createTableIfMissing, addIndexIfMissing } = require('../src/utils/migrate-helpers');
// Tabel pengguna. Format sama dengan sequelize-cli: { up, down }.
module.exports = {
  async up(queryInterface, Sequelize) {
    await createTableIfMissing(queryInterface, 'users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      passwordHash: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.ENUM('admin', 'user'), allowNull: false, defaultValue: 'user' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users', {});
    if (queryInterface.sequelize.getDialect() === 'postgres') await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role"');
  },
};
