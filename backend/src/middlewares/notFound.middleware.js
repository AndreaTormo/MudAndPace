function notFoundMiddleware(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint no encontrado: ${req.method} ${req.originalUrl}`
    }
  });
}

module.exports = notFoundMiddleware;
