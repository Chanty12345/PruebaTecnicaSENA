
const authService = require('../services/authService');

// Crear un usuario
const crearUsuario = async (req, res, next) => {
  try {
    const usuario = await authService.crearUsuario(req.body);

    return res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente.',
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

// Iniciar sesión
const iniciarSesion = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    const resultado = await authService.iniciarSesion(email, password);

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      data: resultado
    });
  } catch (error) {
    next(error);
  }
};

// Listar usuarios
const listarUsuarios = async (req, res, next) => {
  try {
    const usuarios = await authService.listarUsuarios();

    return res.status(200).json({
      success: true,
      total: usuarios.length,
      data: usuarios
    });
  } catch (error) {
    next(error);
  }
};

// Consultar usuario por ID
const obtenerUsuarioPorId = async (req, res, next) => {
  try {
    const usuario = await authService.obtenerUsuarioPorId(req.params.id);

    return res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar usuario
const actualizarUsuario = async (req, res, next) => {
  try {
    const usuario = await authService.actualizarUsuario(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado correctamente.',
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

// Desactivar usuario
const desactivarUsuario = async (req, res, next) => {
  try {
    const usuario = await authService.desactivarUsuario(
      req.params.id,
      req.usuario.id
    );

    return res.status(200).json({
      success: true,
      message: 'Usuario desactivado correctamente.',
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

// Reactivar usuario
const reactivarUsuario = async (req, res, next) => {
  try {
    const usuario = await authService.reactivarUsuario(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Usuario reactivado correctamente.',
      data: usuario
    });
  } catch (error) {
    next(error);
  }
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
