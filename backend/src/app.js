
const express = require('express');
const cors = require('cors');

const activoRoutes = require('./routes/activoRoutes');
const authRoutes = require('./routes/authRoutes');
const ordenTrabajoRoutes = require('./routes/ordenTrabajoRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

// Verificar que la API funciona
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API ORION funcionando correctamente'
  });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de activos
app.use('/api/activos', activoRoutes);

app.use('/api/ordenes', ordenTrabajoRoutes);

// Middleware centralizado de errores
app.use(errorMiddleware);

module.exports = app;
