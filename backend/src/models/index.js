
const Usuario = require('./Usuario');
const Activo = require('./Activo');
const OrdenTrabajo = require('./OrdenTrabajo');
const OrdenResponsable = require('./OrdenResponsable');
const HistorialEstado = require('./HistorialEstado');

// Un activo puede tener muchas órdenes
Activo.hasMany(OrdenTrabajo, {
  foreignKey: 'activoId',
  as: 'ordenes'
});

// Cada orden pertenece a un activo
OrdenTrabajo.belongsTo(Activo, {
  foreignKey: 'activoId',
  as: 'activo'
});

// Una orden puede tener varios responsables
OrdenTrabajo.hasMany(OrdenResponsable, {
  foreignKey: 'ordenTrabajoId',
  as: 'responsables'
});

OrdenResponsable.belongsTo(OrdenTrabajo, {
  foreignKey: 'ordenTrabajoId',
  as: 'orden'
});

// Un usuario puede tener varias asignaciones
Usuario.hasMany(OrdenResponsable, {
  foreignKey: 'usuarioId',
  as: 'asignaciones'
});

OrdenResponsable.belongsTo(Usuario, {
  foreignKey: 'usuarioId',
  as: 'usuario'
});

// Una orden puede tener muchos cambios de estado
OrdenTrabajo.hasMany(HistorialEstado, {
  foreignKey: 'ordenTrabajoId',
  as: 'historial'
});

HistorialEstado.belongsTo(OrdenTrabajo, {
  foreignKey: 'ordenTrabajoId',
  as: 'orden'
});

// Un usuario puede realizar muchos cambios de estado
Usuario.hasMany(HistorialEstado, {
  foreignKey: 'usuarioId',
  as: 'cambiosEstado'
});

HistorialEstado.belongsTo(Usuario, {
  foreignKey: 'usuarioId',
  as: 'usuario'
});

module.exports = {
  Usuario,
  Activo,
  OrdenTrabajo,
  OrdenResponsable,
  HistorialEstado
};
