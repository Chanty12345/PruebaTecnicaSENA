
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrdenResponsable = sequelize.define('OrdenResponsable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ordenTrabajoId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  funcion: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'ordenes_responsables',
  timestamps: true
});

module.exports = OrdenResponsable;
