'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First create the enum type
    await queryInterface.sequelize.query('CREATE TYPE "enum_users_role" AS ENUM (\'user\', \'hr\', \'admin\');');

    // Then create the users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('user', 'hr', 'admin'),
        defaultValue: 'user',
        allowNull: false
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password_changed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the table first
    await queryInterface.dropTable('users');
    // Then drop the enum type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  }
}; 