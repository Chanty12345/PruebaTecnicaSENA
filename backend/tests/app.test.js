
const request = require('supertest');
const app = require('../src/app');

describe('API ORION', () => {
  test('Debe responder correctamente en la ruta de salud', async () => {
    const respuesta = await request(app).get('/api/health');

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.body.success).toBe(true);
    expect(respuesta.body.message).toBe(
      'API ORION funcionando correctamente'
    );
  });
});
