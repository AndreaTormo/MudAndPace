function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Error interno del servidor';

  if (statusCode >= 500) console.error(err);
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(err.details ? { details: err.details } : {})
    }
  });
}

module.exports = errorMiddleware;
