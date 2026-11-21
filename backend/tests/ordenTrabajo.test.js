
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const sequelize = require('../src/config/database');

const {
  Usuario,
  Activo,
  OrdenTrabajo,
  OrdenResponsable,
  HistorialEstado
} = require('../src/models');

let administrador;
let mantenimiento;
let otroMantenimiento;
let consulta;

let tokenAdministrador;
let tokenMantenimiento;
let tokenOtroMantenimiento;
let tokenConsulta;

let activo;

const datosOrden = {
  titulo: 'Mantenimiento preventivo de cámara',
  descripcion: 'Revisión de conexión, cableado y funcionamiento general.'
};

// Crear usuarios de prueba y generar sus tokens
const crearUsuarioPrueba = async (rol, email) => {
  const password = await bcrypt.hash('Prueba123A', 10);

  const usuario = await Usuario.create({
    nombres: 'Usuario',
    apellidos: 'De Prueba',
    email,
    password,
    rol,
    estado: true
  });

  const token = jwt.sign(
    { id: usuario.id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { usuario, token };
};

// Crear un activo para las pruebas
const crearActivoPrueba = async (estado = true) => {
  return await Activo.create({
    inventory: `INV-TEST-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    nombre: 'Cámara de seguridad',
    tipo: 'Cámara',
    ubicacion: 'Entrada principal - Bloque A',
    estado,
    fechaRegistro: '2026-11-20'
  });
};

// Crear una orden mediante la API
const crearOrdenPorApi = async (token = tokenAdministrador, datos = {}) => {
  return await request(app)
    .post('/api/ordenes')
    .set('Authorization', `Bearer ${token}`)
    .send({
      activoId: activo.id,
      ...datosOrden,
      ...datos
    });
};

describe('Pruebas del módulo de órdenes de trabajo', () => {

  // Comprobar la conexión con la base de datos de pruebas
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  // Limpiar los datos y preparar los usuarios antes de cada prueba
  beforeEach(async () => {
    // Eliminar primero los registros que dependen de las órdenes y usuarios
    await HistorialEstado.destroy({ where: {} });
    await OrdenResponsable.destroy({ where: {} });
    await OrdenTrabajo.destroy({ where: {} });

    // Después eliminar activos y usuarios
    await Activo.destroy({ where: {} });
    await Usuario.destroy({ where: {} });

    const resultadoAdmin = await crearUsuarioPrueba(
      'administrador',
      'admin@ordenes.test'
    );

    administrador = resultadoAdmin.usuario;
    tokenAdministrador = resultadoAdmin.token;

    const resultadoMantenimiento = await crearUsuarioPrueba(
      'mantenimiento',
      'mantenimiento@ordenes.test'
    );

    mantenimiento = resultadoMantenimiento.usuario;
    tokenMantenimiento = resultadoMantenimiento.token;

    const resultadoOtroMantenimiento = await crearUsuarioPrueba(
      'mantenimiento',
      'mantenimiento2@ordenes.test'
    );

    otroMantenimiento = resultadoOtroMantenimiento.usuario;
    tokenOtroMantenimiento = resultadoOtroMantenimiento.token;

    const resultadoConsulta = await crearUsuarioPrueba(
      'consulta',
      'consulta@ordenes.test'
    );

    consulta = resultadoConsulta.usuario;
    tokenConsulta = resultadoConsulta.token;

    activo = await crearActivoPrueba();
  });

  // Cerrar la conexión al terminar todas las pruebas
  afterAll(async () => {
    await sequelize.close();
  });

  // --------------------------------------------------
  // CREACIÓN DE ÓRDENES
  // --------------------------------------------------

  test('Debe crear una orden correctamente como administrador', async () => {
    const respuesta = await crearOrdenPorApi(tokenAdministrador, {
      prioridad: 'alta'
    });

    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.body.success).toBe(true);
    expect(respuesta.body.data.titulo).toBe(datosOrden.titulo);
    expect(respuesta.body.data.prioridad).toBe('alta');
    expect(respuesta.body.data.estado).toBe('pendiente');
    expect(respuesta.body.data.fechaInicio).toBeNull();
    expect(respuesta.body.data.fechaFinalizacion).toBeNull();
    expect(respuesta.body.data.historial).toHaveLength(1);
    expect(respuesta.body.data.historial[0].estadoNuevo).toBe('pendiente');
  });

  test('Debe crear una orden con prioridad media por defecto', async () => {
    const respuesta = await crearOrdenPorApi(tokenAdministrador, {
      prioridad: undefined
    });

    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.body.data.prioridad).toBe('media');
  });

  test('Debe permitir que mantenimiento cree una orden sin establecer prioridad', async () => {
    const respuesta = await crearOrdenPorApi(tokenMantenimiento);

    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.body.data.prioridad).toBe('media');
  });

  test('No debe permitir que mantenimiento establezca una prioridad', async () => {
    const respuesta = await crearOrdenPorApi(tokenMantenimiento, {
      prioridad: 'alta'
    });

    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe permitir que mantenimiento asigne responsables al crear una orden', async () => {
    const respuesta = await crearOrdenPorApi(tokenMantenimiento, {
      responsables: [
        {
          usuarioId: mantenimiento.id,
          funcion: 'Diagnóstico'
        }
      ]
    });

    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe crear una orden si faltan datos obligatorios', async () => {
    const respuesta = await crearOrdenPorApi(tokenAdministrador, {
      titulo: '',
      descripcion: 'Descripción de prueba'
    });

    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe crear una orden para un activo inexistente', async () => {
    const respuesta = await crearOrdenPorApi(tokenAdministrador, {
      activoId: 999999
    });

    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe crear una orden para un activo inactivo', async () => {
    await activo.update({ estado: false });

    const respuesta = await crearOrdenPorApi(tokenAdministrador);

    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.body.success).toBe(false);
  });

  test('Debe advertir cuando el activo ya tiene órdenes abiertas', async () => {
    const primeraOrden = await crearOrdenPorApi(tokenAdministrador);

    expect(primeraOrden.statusCode).toBe(201);

    const segundaOrden = await crearOrdenPorApi(tokenAdministrador);

    expect(segundaOrden.statusCode).toBe(201);
    expect(segundaOrden.body.advertencia).toContain(
      'El activo ya tiene 1 orden(es) abierta(s).'
    );
  });

  // --------------------------------------------------
  // CONSULTA DE ÓRDENES
  // --------------------------------------------------

  test('Debe listar las órdenes de trabajo', async () => {
    await crearOrdenPorApi(tokenAdministrador);

    const respuesta = await request(app)
      .get('/api/ordenes')
      .set('Authorization', `Bearer ${tokenConsulta}`);

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.success).toBe(true);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].titulo).toBe(datosOrden.titulo);
  });

  test('Debe consultar una orden por su ID', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);
    const ordenId = creacion.body.data.id;

    const respuesta = await request(app)
      .get(`/api/ordenes/${ordenId}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data.id).toBe(ordenId);
    expect(respuesta.body.data.activo).toBeDefined();
    expect(respuesta.body.data.historial).toHaveLength(1);
  });

  test('Debe devolver error si la orden consultada no existe', async () => {
    const respuesta = await request(app)
      .get('/api/ordenes/999999')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe consultar órdenes sin autenticación', async () => {
    const respuesta = await request(app)
      .get('/api/ordenes');

    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.body.success).toBe(false);
  });

  // --------------------------------------------------
  // ACTUALIZACIÓN DE ÓRDENES
  // --------------------------------------------------

  test('Debe actualizar una orden como administrador', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);
    const ordenId = creacion.body.data.id;

    const respuesta = await request(app)
      .put(`/api/ordenes/${ordenId}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        titulo: 'Mantenimiento actualizado',
        prioridad: 'alta'
      });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data.titulo).toBe('Mantenimiento actualizado');
    expect(respuesta.body.data.prioridad).toBe('alta');
  });

  test('Debe permitir que mantenimiento actualice una orden asignada', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);
    const ordenId = creacion.body.data.id;

    await request(app)
      .put(`/api/ordenes/${ordenId}/responsables`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        responsables: [
          {
            usuarioId: mantenimiento.id,
            funcion: 'Diagnóstico'
          }
        ]
      });

    const respuesta = await request(app)
      .put(`/api/ordenes/${ordenId}`)
      .set('Authorization', `Bearer ${tokenMantenimiento}`)
      .send({
        titulo: 'Revisión realizada'
      });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data.titulo).toBe('Revisión realizada');
  });

  test('No debe permitir que mantenimiento actualice una orden no asignada', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);
    const ordenId = creacion.body.data.id;

    const respuesta = await request(app)
      .put(`/api/ordenes/${ordenId}`)
      .set('Authorization', `Bearer ${tokenMantenimiento}`)
      .send({
        titulo: 'Cambio no autorizado'
      });

    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe permitir que mantenimiento modifique la prioridad', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);
    const ordenId = creacion.body.data.id;

    await request(app)
      .put(`/api/ordenes/${ordenId}/responsables`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        responsables: [
          {
            usuarioId: mantenimiento.id,
            funcion: 'Reparación'
          }
        ]
      });

    const respuesta = await request(app)
      .put(`/api/ordenes/${ordenId}`)
      .set('Authorization', `Bearer ${tokenMantenimiento}`)
      .send({
        prioridad: 'alta'
      });

    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe permitir que consulta actualice una orden', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);

    const respuesta = await request(app)
      .put(`/api/ordenes/${creacion.body.data.id}`)
      .set('Authorization', `Bearer ${tokenConsulta}`)
      .send({
        titulo: 'Cambio no autorizado'
      });

    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.body.success).toBe(false);
  });

  // --------------------------------------------------
  // ASIGNACIÓN DE RESPONSABLES
  // --------------------------------------------------

  test('Debe asignar responsables activos de mantenimiento', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);
    const ordenId = creacion.body.data.id;

    const respuesta = await request(app)
      .put(`/api/ordenes/${ordenId}/responsables`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        responsables: [
          {
            usuarioId: mantenimiento.id,
            funcion: 'Diagnóstico'
          }
        ]
      });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data.responsables).toHaveLength(1);
    expect(respuesta.body.data.responsables[0].funcion).toBe('Diagnóstico');
  });

  test('No debe asignar dos veces al mismo usuario', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);
    const ordenId = creacion.body.data.id;

    const respuesta = await request(app)
      .put(`/api/ordenes/${ordenId}/responsables`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        responsables: [
          {
            usuarioId: mantenimiento.id,
            funcion: 'Diagnóstico'
          },
          {
            usuarioId: mantenimiento.id,
            funcion: 'Reparación'
          }
        ]
      });

    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe asignar usuarios que no tengan rol de mantenimiento', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);

    const respuesta = await request(app)
      .put(`/api/ordenes/${creacion.body.data.id}/responsables`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        responsables: [
          {
            usuarioId: consulta.id,
            funcion: 'Diagnóstico'
          }
        ]
      });

    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.body.success).toBe(false);
  });

  test('Debe permitir retirar todos los responsables de una orden', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);
    const ordenId = creacion.body.data.id;

    await request(app)
      .put(`/api/ordenes/${ordenId}/responsables`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        responsables: [
          {
            usuarioId: mantenimiento.id,
            funcion: 'Diagnóstico'
          }
        ]
      });

    const respuesta = await request(app)
      .put(`/api/ordenes/${ordenId}/responsables`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        responsables: []
      });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data.responsables).toHaveLength(0);
  });

  // --------------------------------------------------
  // CAMBIOS DE ESTADO E HISTORIAL
  // --------------------------------------------------

  test('No debe iniciar una orden si no tiene responsables activos', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);

    const respuesta = await request(app)
      .patch(`/api/ordenes/${creacion.body.data.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estado: 'en_proceso'
      });

    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.body.success).toBe(false);
  });

  test('Debe iniciar una orden cuando tiene un responsable activo', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);
    const ordenId = creacion.body.data.id;

    await request(app)
      .put(`/api/ordenes/${ordenId}/responsables`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        responsables: [
          {
            usuarioId: mantenimiento.id,
            funcion: 'Diagnóstico'
          }
        ]
      });

    const respuesta = await request(app)
      .patch(`/api/ordenes/${ordenId}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estado: 'en_proceso'
      });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data.estado).toBe('en_proceso');
    expect(respuesta.body.data.historial).toHaveLength(2);
    expect(respuesta.body.data.fechaInicio).not.toBeNull();
    expect(new Date(respuesta.body.data.fechaInicio).getTime()).not.toBeNaN();
    expect(respuesta.body.data.fechaFinalizacion).toBeNull();
  });

  test('Debe permitir que mantenimiento cambie el estado de una orden asignada', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);
    const ordenId = creacion.body.data.id;

    await request(app)
      .put(`/api/ordenes/${ordenId}/responsables`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        responsables: [
          {
            usuarioId: mantenimiento.id,
            funcion: 'Diagnóstico'
          }
        ]
      });

    const respuesta = await request(app)
      .patch(`/api/ordenes/${ordenId}/estado`)
      .set('Authorization', `Bearer ${tokenMantenimiento}`)
      .send({
        estado: 'en_proceso'
      });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data.estado).toBe('en_proceso');
  });

  test('No debe permitir que mantenimiento cambie el estado de una orden no asignada', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);
    const ordenId = creacion.body.data.id;

    await request(app)
      .put(`/api/ordenes/${ordenId}/responsables`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        responsables: [
          {
            usuarioId: mantenimiento.id,
            funcion: 'Diagnóstico'
          }
        ]
      });

    const respuesta = await request(app)
      .patch(`/api/ordenes/${ordenId}/estado`)
      .set('Authorization', `Bearer ${tokenOtroMantenimiento}`)
      .send({
        estado: 'en_proceso'
      });

    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.body.success).toBe(false);
  });

  test('Debe rechazar un estado que no exista', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);

    const respuesta = await request(app)
      .patch(`/api/ordenes/${creacion.body.data.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estado: 'en_revision'
      });

    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.body.success).toBe(false);
  });

  test('Debe rechazar una transición de estado no permitida', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);
    const ordenId = creacion.body.data.id;

    const respuesta = await request(app)
      .patch(`/api/ordenes/${ordenId}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estado: 'finalizada'
      });

    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.body.success).toBe(false);
  });

  test('Debe registrar los cambios de estado en el historial', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);
    const ordenId = creacion.body.data.id;

    // Asignar un responsable
    const asignacion = await request(app)
      .put(`/api/ordenes/${ordenId}/responsables`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        responsables: [
          {
            usuarioId: mantenimiento.id,
            funcion: 'Reparación'
          }
        ]
      });

    expect(asignacion.statusCode).toBe(200);

    // Iniciar la orden
    const inicio = await request(app)
      .patch(`/api/ordenes/${ordenId}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estado: 'en_proceso'
      });

    expect(inicio.statusCode).toBe(200);

    // Finalizar la orden
    const respuesta = await request(app)
      .patch(`/api/ordenes/${ordenId}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estado: 'finalizada'
      });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data.estado).toBe('finalizada');
    expect(respuesta.body.data.historial).toHaveLength(3);
    expect(respuesta.body.data.historial[2].estadoAnterior).toBe('en_proceso');
    expect(respuesta.body.data.historial[2].estadoNuevo).toBe('finalizada');

    expect(respuesta.body.data.fechaInicio).not.toBeNull();
    expect(new Date(respuesta.body.data.fechaInicio).getTime()).not.toBeNaN();

    expect(respuesta.body.data.fechaFinalizacion).not.toBeNull();
    expect(new Date(respuesta.body.data.fechaFinalizacion).getTime()).not.toBeNaN();
  });

  test('Debe permitir reabrir una orden finalizada y conservar su historial', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);
    const ordenId = creacion.body.data.id;

    // Asignar un responsable de mantenimiento
    const asignacion = await request(app)
      .put(`/api/ordenes/${ordenId}/responsables`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        responsables: [
          {
            usuarioId: mantenimiento.id,
            funcion: 'Reparación'
          }
        ]
      });

    expect(asignacion.statusCode).toBe(200);

    // Iniciar la orden
    const inicio = await request(app)
      .patch(`/api/ordenes/${ordenId}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estado: 'en_proceso'
      });

    expect(inicio.statusCode).toBe(200);

    // Finalizar la orden
    const finalizacion = await request(app)
      .patch(`/api/ordenes/${ordenId}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estado: 'finalizada'
      });

    expect(finalizacion.statusCode).toBe(200);
    expect(finalizacion.body.data.estado).toBe('finalizada');
    const fechaInicioOriginal = finalizacion.body.data.fechaInicio;

    // Reabrir la orden
    const reapertura = await request(app)
      .patch(`/api/ordenes/${ordenId}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estado: 'en_proceso'
      });

    expect(reapertura.statusCode).toBe(200);
    expect(reapertura.body.data.estado).toBe('en_proceso');

    expect(reapertura.body.data.fechaInicio).toBe(fechaInicioOriginal);
    expect(reapertura.body.data.fechaFinalizacion).toBeNull();

    // Comprobar que se conservaron los cuatro eventos
    expect(reapertura.body.data.historial).toHaveLength(4);

    expect(reapertura.body.data.historial[0].estadoNuevo).toBe('pendiente');
    expect(reapertura.body.data.historial[1].estadoNuevo).toBe('en_proceso');
    expect(reapertura.body.data.historial[2].estadoNuevo).toBe('finalizada');
    expect(reapertura.body.data.historial[3].estadoAnterior).toBe('finalizada');
    expect(reapertura.body.data.historial[3].estadoNuevo).toBe('en_proceso');
  });

  test('Debe permitir cancelar una orden pendiente como administrador', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);

    const respuesta = await request(app)
      .patch(`/api/ordenes/${creacion.body.data.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estado: 'cancelada'
      });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data.estado).toBe('cancelada');
  });

  test('No debe permitir cambiar el estado de una orden cancelada', async () => {
    const creacion = await crearOrdenPorApi(tokenAdministrador);
    const ordenId = creacion.body.data.id;

    await request(app)
      .patch(`/api/ordenes/${ordenId}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estado: 'cancelada'
      });

    const respuesta = await request(app)
      .patch(`/api/ordenes/${ordenId}/estado`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        estado: 'pendiente'
      });

    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.body.success).toBe(false);
  });

});
