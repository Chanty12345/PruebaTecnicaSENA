
const activoService = require('../services/activoService');

// Registrar un activo
const crearActivo = async (req, res, next) => {
  try {
    const activo = await activoService.registrarActivo(req.body);

    return res.status(201).json({
      success: true,
      message: 'Activo registrado correctamente.',
      data: activo
    });
  } catch (error) {
    next(error);
  }
};

// Consultar todos los activos
const listarActivos = async (req, res, next) => {
  try {
    const activos = await activoService.listarActivos();

    return res.status(200).json({
      success: true,
      total: activos.length,
      data: activos
    });
  } catch (error) {
    next(error);
  }
};

// Consultar un activo por su ID
const obtenerActivoPorId = async (req, res, next) => {
  try {
    const activo = await activoService.obtenerActivoPorId(req.params.id);

    return res.status(200).json({
      success: true,
      data: activo
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar un activo
const actualizarActivo = async (req, res, next) => {
  try {
    const activo = await activoService.actualizarActivo(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Activo actualizado correctamente.',
      data: activo
    });
  } catch (error) {
    next(error);
  }
};

// Desactivar un activo
const desactivarActivo = async (req, res, next) => {
  try {
    const activo = await activoService.desactivarActivo(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Activo desactivado correctamente.',
      data: activo
    });
  } catch (error) {
    next(error);
  }
};

// Reactivar un activo
const reactivarActivo = async (req, res, next) => {
  try {
    const activo = await activoService.reactivarActivo(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Activo reactivado correctamente.',
      data: activo
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearActivo,
  listarActivos,
  obtenerActivoPorId,
  actualizarActivo,
  desactivarActivo,
  reactivarActivo
};
