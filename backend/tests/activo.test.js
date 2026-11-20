
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

let tokenAdministrador;
let tokenConsulta;

// Datos de ejemplo para registrar un activo
const datosActivo = {
  nombre: 'Cámara de seguridad',
  tipo: 'Cámara',
  ubicacion: 'Entrada principal - Bloque A',
  fechaRegistro: '2026-11-20'
};

// Crear un usuario y generar su token de autenticación
const crearUsuarioPrueba = async (rol) => {
  const password = await bcrypt.hash('Prueba123A', 10);

  const usuario = await Usuario.create({
    nombres: 'Usuario',
    apellidos: 'De Prueba',
    email: `${rol}@orion.test`,
    password,
    rol,
    estado: true
  });

  return jwt.sign(
    { id: usuario.id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Pruebas del módulo de activos', () => {

  // Comprobar la conexión antes de comenzar
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  // Preparar usuarios y limpiar datos antes de cada prueba
 beforeEach(async () => {
  // Eliminar primero los registros relacionados con las órdenes
  await HistorialEstado.destroy({ where: {} });
  await OrdenResponsable.destroy({ where: {} });
  await OrdenTrabajo.destroy({ where: {} });

  // Después eliminar activos y usuarios
  await Activo.destroy({ where: {} });
  await Usuario.destroy({ where: {} });

  tokenAdministrador = await crearUsuarioPrueba('administrador');
  tokenConsulta = await crearUsuarioPrueba('consulta');
});

  // Cerrar la conexión después de todas las pruebas
  afterAll(async () => {
    await sequelize.close();
  });

  test('Debe crear un activo correctamente', async () => {
    const respuesta = await request(app)
      .post('/api/activos')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send(datosActivo);

    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.body.success).toBe(true);
    expect(respuesta.body.data.nombre).toBe(datosActivo.nombre);
    expect(respuesta.body.data.inventory).toMatch(/^INV-\d{4,}$/);
    expect(respuesta.body.data.estado).toBe(true);
  });

  test('No debe crear un activo si faltan campos obligatorios', async () => {
    const respuesta = await request(app)
      .post('/api/activos')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        nombre: '',
        tipo: 'Cámara',
        ubicacion: 'Entrada principal',
        fechaRegistro: '2026-11-20'
      });

    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.body.success).toBe(false);
  });

  test('Debe listar los activos correctamente', async () => {
    await Activo.create({
      inventory: 'INV-TEST-001',
      ...datosActivo,
      estado: true
    });

    const respuesta = await request(app)
      .get('/api/activos')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.success).toBe(true);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].nombre).toBe(datosActivo.nombre);
  });

  test('Debe consultar un activo por su ID', async () => {
    const activo = await Activo.create({
      inventory: 'INV-TEST-002',
      ...datosActivo,
      estado: true
    });

    const respuesta = await request(app)
      .get(`/api/activos/${activo.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data.id).toBe(activo.id);
  });

  test('Debe actualizar un activo correctamente', async () => {
    const activo = await Activo.create({
      inventory: 'INV-TEST-003',
      ...datosActivo,
      estado: true
    });

    const respuesta = await request(app)
      .put(`/api/activos/${activo.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        ...datosActivo,
        nombre: 'Cámara actualizada'
      });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data.nombre).toBe('Cámara actualizada');
  });

  test('Debe desactivar un activo sin eliminarlo', async () => {
    const activo = await Activo.create({
      inventory: 'INV-TEST-004',
      ...datosActivo,
      estado: true
    });

    const respuesta = await request(app)
      .delete(`/api/activos/${activo.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data.estado).toBe(false);

    const activoEnBaseDatos = await Activo.findByPk(activo.id);

    expect(activoEnBaseDatos).not.toBeNull();
    expect(activoEnBaseDatos.estado).toBe(false);
  });

  test('Debe reactivar un activo desactivado', async () => {
    const activo = await Activo.create({
      inventory: 'INV-TEST-005',
      ...datosActivo,
      estado: false
    });

    const respuesta = await request(app)
      .patch(`/api/activos/${activo.id}/reactivar`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data.estado).toBe(true);
  });

  test('No debe permitir que un usuario de consulta registre activos', async () => {
    const respuesta = await request(app)
      .post('/api/activos')
      .set('Authorization', `Bearer ${tokenConsulta}`)
      .send(datosActivo);

    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe permitir consultar activos sin autenticación', async () => {
    const respuesta = await request(app)
      .get('/api/activos');

    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.body.success).toBe(false);
  });

});
