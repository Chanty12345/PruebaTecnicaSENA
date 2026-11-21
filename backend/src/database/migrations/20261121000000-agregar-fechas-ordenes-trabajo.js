'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'ordenes_trabajo',
      'fechaInicio',
      {
        type: Sequelize.DATE,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      'ordenes_trabajo',
      'fechaFinalizacion',
      {
        type: Sequelize.DATE,
        allowNull: true
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(
      'ordenes_trabajo',
      'fechaFinalizacion'
    );

    await queryInterface.removeColumn(
      'ordenes_trabajo',
      'fechaInicio'
    );
  }
};
