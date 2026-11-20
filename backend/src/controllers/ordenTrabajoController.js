
const ordenTrabajoService = require('../services/ordenTrabajoService');

// Crear una orden de trabajo
const crearOrdenTrabajo = async (req, res, next) => {
  try {
    const resultado = await ordenTrabajoService.crearOrdenTrabajo(
      req.body,
      req.usuario
    );

    return res.status(201).json({
      success: true,
      message: 'Orden de trabajo creada correctamente.',
      advertencia: resultado.advertencia
        ? `El activo ya tiene ${resultado.ordenesAbiertas} orden(es) abierta(s).`
        : null,
      data: resultado.orden
    });
  } catch (error) {
    next(error);
  }
};

// Consultar todas las órdenes
const listarOrdenesTrabajo = async (req, res, next) => {
  try {
    const ordenes = await ordenTrabajoService.listarOrdenesTrabajo();

    return res.status(200).json({
      success: true,
      total: ordenes.length,
      data: ordenes
    });
  } catch (error) {
    next(error);
  }
};

// Consultar una orden por su ID
const obtenerOrdenPorId = async (req, res, next) => {
  try {
    const orden = await ordenTrabajoService.obtenerOrdenPorId(req.params.id);

    return res.status(200).json({
      success: true,
      data: orden
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar una orden
const actualizarOrdenTrabajo = async (req, res, next) => {
  try {
    const orden = await ordenTrabajoService.actualizarOrdenTrabajo(
      req.params.id,
      req.body,
      req.usuario
    );

    return res.status(200).json({
      success: true,
      message: 'Orden de trabajo actualizada correctamente.',
      data: orden
    });
  } catch (error) {
    next(error);
  }
};

// Asignar responsables
const asignarResponsables = async (req, res, next) => {
  try {
    const orden = await ordenTrabajoService.asignarResponsables(
      req.params.id,
      req.body.responsables
    );

    return res.status(200).json({
      success: true,
      message: 'Responsables actualizados correctamente.',
      data: orden
    });
  } catch (error) {
    next(error);
  }
};

// Cambiar el estado de una orden
const cambiarEstadoOrden = async (req, res, next) => {
  try {
    const orden = await ordenTrabajoService.cambiarEstadoOrden(
      req.params.id,
      req.body.estado,
      req.usuario
    );

    return res.status(200).json({
      success: true,
      message: 'Estado de la orden actualizado correctamente.',
      data: orden
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearOrdenTrabajo,
  listarOrdenesTrabajo,
  obtenerOrdenPorId,
  actualizarOrdenTrabajo,
  asignarResponsables,
  cambiarEstadoOrden
};
