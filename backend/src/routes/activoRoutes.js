
const express = require('express');
const router = express.Router();

const activoController = require('../controllers/activoController');

const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

// Consultar todos los activos
router.get(
  '/',
  verificarToken,
  activoController.listarActivos
);

// Consultar un activo por ID
router.get(
  '/:id',
  verificarToken,
  activoController.obtenerActivoPorId
);

// Registrar un activo: solamente administrador
router.post(
  '/',
  verificarToken,
  permitirRoles('administrador'),
  activoController.crearActivo
);

// Actualizar un activo: solamente administrador
router.put(
  '/:id',
  verificarToken,
  permitirRoles('administrador'),
  activoController.actualizarActivo
);

// Desactivar un activo: solamente administrador
router.delete(
  '/:id',
  verificarToken,
  permitirRoles('administrador'),
  activoController.desactivarActivo
);

// Reactivar un activo: solamente administrador
router.patch(
  '/:id/reactivar',
  verificarToken,
  permitirRoles('administrador'),
  activoController.reactivarActivo
);

module.exports = router;
