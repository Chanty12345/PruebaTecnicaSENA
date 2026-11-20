
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrdenTrabajo = sequelize.define('OrdenTrabajo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  activoId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  prioridad: {
    type: DataTypes.ENUM('baja', 'media', 'alta'),
    allowNull: false,
    defaultValue: 'media'
  },
  estado: {
    type: DataTypes.ENUM(
      'pendiente',
      'en_proceso',
      'finalizada',
      'cancelada'
    ),
    allowNull: false,
    defaultValue: 'pendiente'
  }
}, {
  tableName: 'ordenes_trabajo',
  timestamps: true
});

module.exports = OrdenTrabajo;
