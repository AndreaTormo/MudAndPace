const fs = require('fs');

function uploadedFiles(req) {
  if (Array.isArray(req.files)) {
    return req.files;
  }
  if (req.files && typeof req.files === 'object') {
    return Object.values(req.files).flat();
  }
  return [];
}

function cleanupUploads(req) {
  for (const file of uploadedFiles(req)) {
    if (file?.path) {
      fs.unlink(file.path, () => {});
    }
  }
}

function multerMessage(code) {
  switch (code) {
    case 'LIMIT_FILE_SIZE':
      return 'Cada imagen no puede superar los 5 MB';
    case 'LIMIT_FILE_COUNT':
    case 'LIMIT_UNEXPECTED_FILE':
      return 'Puedes subir como máximo 8 fotos por evento';
    default:
      return 'No se pudo subir la imagen';
  }
}

function errorMiddleware(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Error interno del servidor';

  if (err.name === 'MulterError') {
    cleanupUploads(req);
    statusCode = 400;
    code = err.code;
    message = multerMessage(err.code);
  }

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
