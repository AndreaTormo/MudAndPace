function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) console.error(err);
  res.status(statusCode).json({ error: { code: err.code || 'INTERNAL_SERVER_ERROR', message: err.message || 'Error interno del servidor', ...(err.details ? { details: err.details } : {}) } });
}
module.exports = errorMiddleware;
