
const express = require('express');
const router = express.Router();

const ordenTrabajoController = require('../controllers/ordenTrabajoController');

const {
  verificarToken,
  permitirRoles
} = require('../middlewares/authMiddleware');

// Consultar todas las órdenes
router.get(
  '/',
  verificarToken,
  ordenTrabajoController.listarOrdenesTrabajo
);

// Consultar una orden por ID
router.get(
  '/:id',
  verificarToken,
  ordenTrabajoController.obtenerOrdenPorId
);

// Crear una orden: administrador y mantenimiento
router.post(
  '/',
  verificarToken,
  permitirRoles('administrador', 'mantenimiento'),
  ordenTrabajoController.crearOrdenTrabajo
);

// Actualizar una orden
router.put(
  '/:id',
  verificarToken,
  permitirRoles('administrador', 'mantenimiento'),
  ordenTrabajoController.actualizarOrdenTrabajo
);

// Asignar o reemplazar responsables: solamente administrador
router.put(
  '/:id/responsables',
  verificarToken,
  permitirRoles('administrador'),
  ordenTrabajoController.asignarResponsables
);

// Cambiar el estado de una orden
router.patch(
  '/:id/estado',
  verificarToken,
  permitirRoles('administrador', 'mantenimiento'),
  ordenTrabajoController.cambiarEstadoOrden
);

module.exports = router;
