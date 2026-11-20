
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('historial_estados', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      ordenTrabajoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'ordenes_trabajo',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      estadoAnterior: {
        type: Sequelize.ENUM(
          'pendiente',
          'en_proceso',
          'finalizada',
          'cancelada'
        ),
        allowNull: true
      },
      estadoNuevo: {
        type: Sequelize.ENUM(
          'pendiente',
          'en_proceso',
          'finalizada',
          'cancelada'
        ),
        allowNull: false
      },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      fechaCambio: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('historial_estados');
  }
};
