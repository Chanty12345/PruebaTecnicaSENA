
const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 3000;

const iniciarServidor = async () => {
  try {
    // Comprobar conexión con MySQL
    await sequelize.authenticate();

    console.log('Conexión con MySQL establecida correctamente.');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor ORION ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

iniciarServidor();
