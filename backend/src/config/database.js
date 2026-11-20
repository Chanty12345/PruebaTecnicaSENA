
const { Sequelize } = require('sequelize');
require('dotenv').config({ quiet: true });

const entorno = process.env.NODE_ENV || 'development';

const nombreBaseDatos = entorno === 'test'
  ? process.env.DB_NAME_TEST || 'orion_maintenance_test'
  : process.env.DB_NAME;

const sequelize = new Sequelize(
  nombreBaseDatos,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
  }
);

module.exports = sequelize;
