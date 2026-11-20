
const crypto = require('crypto');
const { Activo } = require('../models');
const sequelize = require('../config/database');

// Registrar un activo
const registrarActivo = async (datos) => {
  const { nombre, tipo, ubicacion, fechaRegistro } = datos;

  validarDatosActivo(datos);

  const activo = await sequelize.transaction(async (transaction) => {
    const activoCreado = await Activo.create({
      inventory: `PEND-${crypto.randomUUID()}`,
      nombre: nombre.trim(),
      tipo: tipo.trim(),
      ubicacion: ubicacion.trim(),
      fechaRegistro,
      estado: true
    }, { transaction });

    const inventory = `INV-${String(activoCreado.id).padStart(4, '0')}`;

    await activoCreado.update({
      inventory
    }, { transaction });

    return activoCreado;
  });

  return activo;
};

// Consultar todos los activos
const listarActivos = async () => {
  return await Activo.findAll({
    order: [['id', 'ASC']]
  });
};

// Consultar un activo por su ID
const obtenerActivoPorId = async (id) => {
  const activo = await buscarActivo(id);
  return activo;
};

// Actualizar los datos de un activo
const actualizarActivo = async (id, datos) => {
  validarDatosActivo(datos);

  const activo = await buscarActivo(id);

  await activo.update({
    nombre: datos.nombre.trim(),
    tipo: datos.tipo.trim(),
    ubicacion: datos.ubicacion.trim(),
    fechaRegistro: datos.fechaRegistro
  });

  return activo;
};

// Desactivar un activo sin eliminarlo
const desactivarActivo = async (id) => {
  const activo = await buscarActivo(id);

  if (!activo.estado) {
    const error = new Error('El activo ya se encuentra desactivado.');
    error.statusCode = 409;
    throw error;
  }

  await activo.update({
    estado: false
  });

  return activo;
};

// Reactivar un activo
const reactivarActivo = async (id) => {
  const activo = await buscarActivo(id);

  if (activo.estado) {
    const error = new Error('El activo ya se encuentra activo.');
    error.statusCode = 409;
    throw error;
  }

  await activo.update({
    estado: true
  });

  return activo;
};

// Buscar un activo y validar su ID
const buscarActivo = async (id) => {
  if (!/^[1-9]\d*$/.test(String(id))) {
    const error = new Error('El ID del activo no es válido.');
    error.statusCode = 400;
    throw error;
  }

  const activo = await Activo.findByPk(id);

  if (!activo) {
    const error = new Error('Activo no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  return activo;
};

// Validar los datos obligatorios del activo
const validarDatosActivo = (datos) => {
  const { nombre, tipo, ubicacion, fechaRegistro } = datos;

  if (
    typeof nombre !== 'string' || !nombre.trim() ||
    typeof tipo !== 'string' || !tipo.trim() ||
    typeof ubicacion !== 'string' || !ubicacion.trim() ||
    typeof fechaRegistro !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fechaRegistro)
  ) {
    const error = new Error('Todos los campos son obligatorios y deben tener un formato válido.');
    error.statusCode = 400;
    throw error;
  }

  const fecha = new Date(`${fechaRegistro}T00:00:00Z`);

  if (
    Number.isNaN(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== fechaRegistro
  ) {
    const error = new Error('La fecha de registro no es válida.');
    error.statusCode = 400;
    throw error;
  }
};

module.exports = {
  registrarActivo,
  listarActivos,
  obtenerActivoPorId,
  actualizarActivo,
  desactivarActivo,
  reactivarActivo
};
