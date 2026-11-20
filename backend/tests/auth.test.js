
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
let consulta;

let tokenAdministrador;
let tokenMantenimiento;
let tokenConsulta;

const datosUsuario = {
  nombres: 'Nuevo',
  apellidos: 'Usuario',
  email: 'nuevo@orion.test',
  password: 'Prueba123A',
  rol: 'consulta'
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

describe('Pruebas de autenticación y usuarios', () => {

  beforeAll(async () => {
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Limpiar primero las tablas relacionadas
    await HistorialEstado.destroy({ where: {} });
    await OrdenResponsable.destroy({ where: {} });
    await OrdenTrabajo.destroy({ where: {} });
    await Activo.destroy({ where: {} });
    await Usuario.destroy({ where: {} });

    // Crear los tres tipos de usuario
    const resultadoAdmin = await crearUsuarioPrueba(
      'administrador',
      'admin@auth.test'
    );

    administrador = resultadoAdmin.usuario;
    tokenAdministrador = resultadoAdmin.token;

    const resultadoMantenimiento = await crearUsuarioPrueba(
      'mantenimiento',
      'mantenimiento@auth.test'
    );

    mantenimiento = resultadoMantenimiento.usuario;
    tokenMantenimiento = resultadoMantenimiento.token;

    const resultadoConsulta = await crearUsuarioPrueba(
      'consulta',
      'consulta@auth.test'
    );

    consulta = resultadoConsulta.usuario;
    tokenConsulta = resultadoConsulta.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // --------------------------------------------------
  // INICIO DE SESIÓN
  // --------------------------------------------------

  test('Debe iniciar sesión con credenciales correctas', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({
        email: administrador.email,
        password: 'Prueba123A'
      });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.success).toBe(true);
    expect(respuesta.body.data.token).toBeDefined();
    expect(respuesta.body.data.usuario.email).toBe(administrador.email);
    expect(respuesta.body.data.usuario.rol).toBe('administrador');
    expect(respuesta.body.data.usuario.password).toBeUndefined();
  });

  test('No debe iniciar sesión con una contraseña incorrecta', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({
        email: administrador.email,
        password: 'Incorrecta123'
      });

    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe iniciar sesión con un correo inexistente', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'inexistente@orion.test',
        password: 'Prueba123A'
      });

    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe iniciar sesión si faltan las credenciales', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({
        email: administrador.email
      });

    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe iniciar sesión con un usuario desactivado', async () => {
    await administrador.update({ estado: false });

    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({
        email: administrador.email,
        password: 'Prueba123A'
      });

    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.body.success).toBe(false);
  });

  // --------------------------------------------------
  // VERIFICACIÓN DEL TOKEN
  // --------------------------------------------------

  test('No debe permitir acceder sin un token', async () => {
    const respuesta = await request(app)
      .get('/api/auth/usuarios');

    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe permitir acceder con un token inválido', async () => {
    const respuesta = await request(app)
      .get('/api/auth/usuarios')
      .set('Authorization', 'Bearer token_invalido');

    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe permitir acceder con un token de un usuario desactivado', async () => {
    await administrador.update({ estado: false });

    const respuesta = await request(app)
      .get('/api/auth/usuarios')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.statusCode).toBe(401);
    expect(respuesta.body.success).toBe(false);
  });

  // --------------------------------------------------
  // ADMINISTRACIÓN DE USUARIOS
  // --------------------------------------------------

  test('Debe permitir que el administrador cree un usuario', async () => {
    const respuesta = await request(app)
      .post('/api/auth/usuarios')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send(datosUsuario);

    expect(respuesta.statusCode).toBe(201);
    expect(respuesta.body.success).toBe(true);
    expect(respuesta.body.data.email).toBe(datosUsuario.email);
    expect(respuesta.body.data.rol).toBe('consulta');
    expect(respuesta.body.data.password).toBeUndefined();

    const usuarioGuardado = await Usuario.findOne({
      where: { email: datosUsuario.email }
    });

    expect(usuarioGuardado).not.toBeNull();
    expect(usuarioGuardado.password).not.toBe(datosUsuario.password);
  });

  test('No debe permitir crear usuarios con un correo duplicado', async () => {
    const respuesta = await request(app)
      .post('/api/auth/usuarios')
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        ...datosUsuario,
        email: administrador.email
      });

    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe permitir que mantenimiento cree usuarios', async () => {
    const respuesta = await request(app)
      .post('/api/auth/usuarios')
      .set('Authorization', `Bearer ${tokenMantenimiento}`)
      .send(datosUsuario);

    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe permitir que consulta liste los usuarios', async () => {
    const respuesta = await request(app)
      .get('/api/auth/usuarios')
      .set('Authorization', `Bearer ${tokenConsulta}`);

    expect(respuesta.statusCode).toBe(403);
    expect(respuesta.body.success).toBe(false);
  });

  test('Debe permitir que el administrador consulte los usuarios', async () => {
    const respuesta = await request(app)
      .get('/api/auth/usuarios')
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.success).toBe(true);
    expect(respuesta.body.total).toBe(3);
    expect(respuesta.body.data[0].password).toBeUndefined();
  });

  test('Debe permitir que el administrador consulte un usuario por ID', async () => {
    const respuesta = await request(app)
      .get(`/api/auth/usuarios/${mantenimiento.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data.id).toBe(mantenimiento.id);
    expect(respuesta.body.data.password).toBeUndefined();
  });

  test('Debe permitir actualizar los datos de un usuario', async () => {
    const respuesta = await request(app)
      .put(`/api/auth/usuarios/${consulta.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        nombres: 'Nombre Actualizado'
      });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.data.nombres).toBe('Nombre Actualizado');
  });

  test('Debe rechazar un correo duplicado al actualizar un usuario', async () => {
    const respuesta = await request(app)
      .put(`/api/auth/usuarios/${consulta.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`)
      .send({
        email: administrador.email
      });

    expect(respuesta.statusCode).toBe(409);
    expect(respuesta.body.success).toBe(false);
  });

  test('No debe permitir que el administrador se desactive a sí mismo', async () => {
    const respuesta = await request(app)
      .delete(`/api/auth/usuarios/${administrador.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(respuesta.statusCode).toBe(400);
    expect(respuesta.body.success).toBe(false);
  });

  test('Debe permitir desactivar y reactivar un usuario', async () => {
    const desactivacion = await request(app)
      .delete(`/api/auth/usuarios/${consulta.id}`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(desactivacion.statusCode).toBe(200);
    expect(desactivacion.body.data.estado).toBe(false);

    const reactivacion = await request(app)
      .patch(`/api/auth/usuarios/${consulta.id}/reactivar`)
      .set('Authorization', `Bearer ${tokenAdministrador}`);

    expect(reactivacion.statusCode).toBe(200);
    expect(reactivacion.body.data.estado).toBe(true);
  });

});
