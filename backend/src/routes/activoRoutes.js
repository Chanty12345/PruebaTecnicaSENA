
const express = require('express');
const router = express.Router();

const activoController = require('../controllers/activoController');

// Registrar un activo
router.post('/', activoController.crearActivo);

// Consultar todos los activos
router.get('/', activoController.listarActivos);

// Consultar un activo por ID
router.get('/:id', activoController.obtenerActivoPorId);

// Actualizar un activo
router.put('/:id', activoController.actualizarActivo);

// Desactivar un activo
router.delete('/:id', activoController.desactivarActivo);

// Reactivar un activo
router.patch('/:id/reactivar', activoController.reactivarActivo);

module.exports = router;
