
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Activo = sequelize.define('Activo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  inventory: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  ubicacion: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  fechaRegistro: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  tableName: 'activos',
  timestamps: true
});

module.exports = Activo;
