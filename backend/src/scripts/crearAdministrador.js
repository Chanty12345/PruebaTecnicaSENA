
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');
const sequelize = require('../config/database');

const crearAdministrador = async () => {
  try {
    const nombres = process.env.ADMIN_NOMBRES;
    const apellidos = process.env.ADMIN_APELLIDOS;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!nombres || !apellidos || !email || !password) {
      throw new Error(
        'Debes configurar los datos del administrador en el archivo .env.'
      );
    }

    if (password.length < 8 || password.length > 72) {
      throw new Error('La contraseña debe tener entre 8 y 72 caracteres.');
    }

    const emailNormalizado = email.trim().toLowerCase();

    const administradorExistente = await Usuario.findOne({
      where: { email: emailNormalizado }
    });

    if (administradorExistente) {
      throw new Error('Ya existe un usuario con ese correo electrónico.');
    }

    const passwordEncriptada = await bcrypt.hash(password, 10);

    const administrador = await Usuario.create({
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      email: emailNormalizado,
      password: passwordEncriptada,
      rol: 'administrador',
      estado: true
    });

    console.log('Administrador creado correctamente.');
    console.log('ID:', administrador.id);
    console.log('Correo:', administrador.email);

  } catch (error) {
    console.error('Error al crear el administrador:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

crearAdministrador();
