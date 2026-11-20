
require('dotenv').config();

const configuracionBase = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: false,
};

module.exports = {
  development: {
    ...configuracionBase,
    database: process.env.DB_NAME,
  },

  test: {
    ...configuracionBase,
    database: process.env.DB_NAME_TEST || 'orion_maintenance_test',
  },

  production: {
    ...configuracionBase,
    database: process.env.DB_NAME,
  },
};
