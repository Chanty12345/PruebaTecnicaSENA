
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      inventory: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      tipo: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      ubicacion: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      estado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      fechaRegistro: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('activos');
  }
};
