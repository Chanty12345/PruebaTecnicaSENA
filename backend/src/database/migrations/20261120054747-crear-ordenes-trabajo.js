
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ordenes_trabajo', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      activoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'activos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      titulo: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      prioridad: {
        type: Sequelize.ENUM('baja', 'media', 'alta'),
        allowNull: false,
        defaultValue: 'media'
      },
      estado: {
        type: Sequelize.ENUM(
          'pendiente',
          'en_proceso',
          'finalizada',
          'cancelada'
        ),
        allowNull: false,
        defaultValue: 'pendiente'
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
    await queryInterface.dropTable('ordenes_trabajo');
  }
};
