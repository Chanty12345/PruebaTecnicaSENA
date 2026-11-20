
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

// Verificar que el usuario esté autenticado
const verificarToken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      const error = new Error('Debes iniciar sesión para acceder a este recurso.');
      error.statusCode = 401;
      throw error;
    }

    const token = authorization.split(' ')[1];

    if (!token) {
      const error = new Error('El token no fue proporcionado.');
      error.statusCode = 401;
      throw error;
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('No está configurada la clave JWT.');
    }

    const datosToken = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findByPk(datosToken.id);

    if (!usuario || !usuario.estado) {
      const error = new Error('El usuario no existe o se encuentra desactivado.');
      error.statusCode = 401;
      throw error;
    }

    req.usuario = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      error.statusCode = 401;
      error.message = 'El token es inválido o ha expirado.';
    }

    next(error);
  }
};

// Verificar los roles permitidos
const permitirRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      const error = new Error('No tienes permisos para realizar esta acción.');
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

module.exports = {
  verificarToken,
  permitirRoles
};
