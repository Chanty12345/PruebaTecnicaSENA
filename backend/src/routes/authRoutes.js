
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

// Iniciar sesión
router.post('/login', authController.iniciarSesion);

// Crear usuarios: solamente administradores
router.post(
  '/usuarios',
  verificarToken,
  permitirRoles('administrador'),
  authController.crearUsuario
);

module.exports = router;
