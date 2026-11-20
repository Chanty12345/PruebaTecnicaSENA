
const errorMiddleware = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Error interno del servidor.'
  });
};

module.exports = errorMiddleware;
