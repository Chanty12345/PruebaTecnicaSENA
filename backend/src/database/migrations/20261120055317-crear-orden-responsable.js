
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ordenes_responsables', {
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
      funcion: {
        type: Sequelize.STRING(100),
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

    await queryInterface.addConstraint('ordenes_responsables', {
      fields: ['ordenTrabajoId', 'usuarioId'],
      type: 'unique',
      name: 'unique_orden_usuario'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ordenes_responsables');
  }
};
