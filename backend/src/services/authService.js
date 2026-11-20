
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

// Crear un usuario
const crearUsuario = async (datos) => {
  const { nombres, apellidos, email, password, rol } = datos;

  validarDatosUsuario(datos);

  const emailNormalizado = email.trim().toLowerCase();

  const usuarioExistente = await Usuario.findOne({
    where: { email: emailNormalizado }
  });

  if (usuarioExistente) {
    const error = new Error('Ya existe un usuario con ese correo electrónico.');
    error.statusCode = 409;
    throw error;
  }

  const passwordEncriptada = await bcrypt.hash(password, 10);

  const usuario = await Usuario.create({
    nombres: nombres.trim(),
    apellidos: apellidos.trim(),
    email: emailNormalizado,
    password: passwordEncriptada,
    rol,
    estado: true
  });

  return {
    id: usuario.id,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    rol: usuario.rol,
    estado: usuario.estado
  };
};

// Iniciar sesión
const iniciarSesion = async (email, password) => {
  if (
    typeof email !== 'string' ||
    !email.trim() ||
    typeof password !== 'string' ||
    !password
  ) {
    const error = new Error('El correo electrónico y la contraseña son obligatorios.');
    error.statusCode = 400;
    throw error;
  }

  const emailNormalizado = email.trim().toLowerCase();

  const usuario = await Usuario.findOne({
    where: { email: emailNormalizado }
  });

  if (!usuario) {
    const error = new Error('Credenciales incorrectas.');
    error.statusCode = 401;
    throw error;
  }

  if (!usuario.estado) {
    const error = new Error('El usuario se encuentra desactivado.');
    error.statusCode = 403;
    throw error;
  }

  const passwordValida = await bcrypt.compare(
    password,
    usuario.password
  );

  if (!passwordValida) {
    const error = new Error('Credenciales incorrectas.');
    error.statusCode = 401;
    throw error;
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('No está configurada la clave JWT.');
  }

  const token = jwt.sign(
    { id: usuario.id },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      rol: usuario.rol
    }
  };
};

// Validar los datos para crear usuarios
const validarDatosUsuario = (datos) => {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    const error = new Error('Debes enviar los datos del usuario.');
    error.statusCode = 400;
    throw error;
  }

  const { nombres, apellidos, email, password, rol } = datos;

  const rolesPermitidos = [
    'administrador',
    'mantenimiento',
    'consulta'
  ];

  if (
    typeof nombres !== 'string' || !nombres.trim() ||
    typeof apellidos !== 'string' || !apellidos.trim() ||
    typeof email !== 'string' || !email.trim() ||
    typeof password !== 'string' ||
    password.length < 8 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    !rolesPermitidos.includes(rol)
  ) {
    const error = new Error(
      'Los datos del usuario no son válidos. Verifica nombres, apellidos, correo, contraseña y rol.'
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    nombres.trim().length > 100 ||
    apellidos.trim().length > 100 ||
    email.trim().length > 150 ||
    password.length > 72
  ) {
    const error = new Error('Uno o más campos superan la longitud permitida.');
    error.statusCode = 400;
    throw error;
  }
};

module.exports = {
  crearUsuario,
  iniciarSesion
};
