
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

// Iniciar sesión
router.post('/login', authController.iniciarSesion);

// Crear usuarios
router.post(
  '/usuarios',
  verificarToken,
  permitirRoles('administrador'),
  authController.crearUsuario
);

// Consultar todos los usuarios
router.get(
  '/usuarios',
  verificarToken,
  permitirRoles('administrador'),
  authController.listarUsuarios
);

// Consultar un usuario por ID
router.get(
  '/usuarios/:id',
  verificarToken,
  permitirRoles('administrador'),
  authController.obtenerUsuarioPorId
);

// Actualizar un usuario
router.put(
  '/usuarios/:id',
  verificarToken,
  permitirRoles('administrador'),
  authController.actualizarUsuario
);

// Desactivar un usuario
router.delete(
  '/usuarios/:id',
  verificarToken,
  permitirRoles('administrador'),
  authController.desactivarUsuario
);

// Reactivar un usuario
router.patch(
  '/usuarios/:id/reactivar',
  verificarToken,
  permitirRoles('administrador'),
  authController.reactivarUsuario
);

module.exports = router;
