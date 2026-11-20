
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Usuario } = require('../models');

// Crear un usuario
const crearUsuario = async (datos) => {
  validarDatosUsuario(datos);

  const { nombres, apellidos, email, password, rol } = datos;

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

  return obtenerDatosPublicos(usuario);
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
    usuario: obtenerDatosPublicos(usuario)
  };
};

// Listar usuarios
const listarUsuarios = async () => {
  const usuarios = await Usuario.findAll({
    attributes: { exclude: ['password'] },
    order: [['id', 'ASC']]
  });

  return usuarios;
};

// Consultar un usuario por ID
const obtenerUsuarioPorId = async (id) => {
  validarId(id);

  const usuario = await Usuario.findByPk(id, {
    attributes: { exclude: ['password'] }
  });

  if (!usuario) {
    const error = new Error('El usuario no existe.');
    error.statusCode = 404;
    throw error;
  }

  return usuario;
};

// Actualizar un usuario
const actualizarUsuario = async (id, datos) => {
  validarId(id);

  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    const error = new Error('Debes enviar los datos para actualizar el usuario.');
    error.statusCode = 400;
    throw error;
  }

  const usuario = await Usuario.findByPk(id);

  if (!usuario) {
    const error = new Error('El usuario no existe.');
    error.statusCode = 404;
    throw error;
  }

  const camposPermitidos = [
    'nombres',
    'apellidos',
    'email',
    'password',
    'rol'
  ];

  const camposEnviados = Object.keys(datos);

  if (
    camposEnviados.length === 0 ||
    camposEnviados.some(campo => !camposPermitidos.includes(campo))
  ) {
    const error = new Error('Los campos enviados no son válidos.');
    error.statusCode = 400;
    throw error;
  }

  const datosActualizados = {};

  if (datos.nombres !== undefined) {
    if (
      typeof datos.nombres !== 'string' ||
      !datos.nombres.trim() ||
      datos.nombres.trim().length > 100
    ) {
      const error = new Error('El nombre no es válido.');
      error.statusCode = 400;
      throw error;
    }

    datosActualizados.nombres = datos.nombres.trim();
  }

  if (datos.apellidos !== undefined) {
    if (
      typeof datos.apellidos !== 'string' ||
      !datos.apellidos.trim() ||
      datos.apellidos.trim().length > 100
    ) {
      const error = new Error('Los apellidos no son válidos.');
      error.statusCode = 400;
      throw error;
    }

    datosActualizados.apellidos = datos.apellidos.trim();
  }

  if (datos.email !== undefined) {
    if (
      typeof datos.email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim()) ||
      datos.email.trim().length > 150
    ) {
      const error = new Error('El correo electrónico no es válido.');
      error.statusCode = 400;
      throw error;
    }

    const emailNormalizado = datos.email.trim().toLowerCase();

    const emailExistente = await Usuario.findOne({
      where: {
        email: emailNormalizado,
        id: { [Op.ne]: id }
      }
    });

    if (emailExistente) {
      const error = new Error('Ese correo electrónico ya está registrado.');
      error.statusCode = 409;
      throw error;
    }

    datosActualizados.email = emailNormalizado;
  }

  if (datos.password !== undefined) {
    if (
      typeof datos.password !== 'string' ||
      datos.password.length < 8 ||
      datos.password.length > 72
    ) {
      const error = new Error('La contraseña debe tener entre 8 y 72 caracteres.');
      error.statusCode = 400;
      throw error;
    }

    datosActualizados.password = await bcrypt.hash(datos.password, 10);
  }

  if (datos.rol !== undefined) {
    const rolesPermitidos = [
      'administrador',
      'mantenimiento',
      'consulta'
    ];

    if (!rolesPermitidos.includes(datos.rol)) {
      const error = new Error('El rol indicado no es válido.');
      error.statusCode = 400;
      throw error;
    }

    datosActualizados.rol = datos.rol;
  }

  await usuario.update(datosActualizados);

  return obtenerDatosPublicos(usuario);
};

// Desactivar usuario
const desactivarUsuario = async (id, usuarioAutenticadoId) => {
  validarId(id);

  const usuario = await Usuario.findByPk(id);

  if (!usuario) {
    const error = new Error('El usuario no existe.');
    error.statusCode = 404;
    throw error;
  }

  if (Number(id) === Number(usuarioAutenticadoId)) {
    const error = new Error('No puedes desactivar tu propio usuario.');
    error.statusCode = 400;
    throw error;
  }

  if (!usuario.estado) {
    const error = new Error('El usuario ya se encuentra desactivado.');
    error.statusCode = 409;
    throw error;
  }

  await usuario.update({ estado: false });

  return obtenerDatosPublicos(usuario);
};

// Reactivar usuario
const reactivarUsuario = async (id) => {
  validarId(id);

  const usuario = await Usuario.findByPk(id);

  if (!usuario) {
    const error = new Error('El usuario no existe.');
    error.statusCode = 404;
    throw error;
  }

  if (usuario.estado) {
    const error = new Error('El usuario ya se encuentra activo.');
    error.statusCode = 409;
    throw error;
  }

  await usuario.update({ estado: true });

  return obtenerDatosPublicos(usuario);
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

// Validar ID
const validarId = (id) => {
  if (!/^[1-9]\d*$/.test(String(id))) {
    const error = new Error('El ID del usuario no es válido.');
    error.statusCode = 400;
    throw error;
  }
};

// Preparar los datos públicos de un usuario
const obtenerDatosPublicos = (usuario) => {
  return {
    id: usuario.id,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    rol: usuario.rol,
    estado: usuario.estado
  };
};

module.exports = {
  crearUsuario,
  iniciarSesion,
  listarUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  desactivarUsuario,
  reactivarUsuario
};
