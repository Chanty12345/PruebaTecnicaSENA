
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistorialEstado = sequelize.define('HistorialEstado', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ordenTrabajoId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  estadoAnterior: {
    type: DataTypes.ENUM(
      'pendiente',
      'en_proceso',
      'finalizada',
      'cancelada'
    ),
    allowNull: true
  },
  estadoNuevo: {
    type: DataTypes.ENUM(
      'pendiente',
      'en_proceso',
      'finalizada',
      'cancelada'
    ),
    allowNull: false
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fechaCambio: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'historial_estados',
  timestamps: true
});

module.exports = HistorialEstado;
