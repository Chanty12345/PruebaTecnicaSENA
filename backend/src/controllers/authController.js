
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

    const resultado = await authService.iniciarSesion(
      email,
      password
    );

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      data: resultado
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearUsuario,
  iniciarSesion
};
