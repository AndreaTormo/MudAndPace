class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR', details = undefined) {
    super(message); this.name = 'AppError'; this.statusCode = statusCode; this.code = code; this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

function normalizeAppError(error) {
  if (error instanceof AppError) return error;
  if (error?.name === 'ValidationError') return new AppError('Los datos enviados no son válidos', 400, 'VALIDATION_ERROR', Object.values(error.errors).map((item) => item.message));
  if (error?.code === 11000) return new AppError('Ya existe un recurso con uno de los campos únicos enviados', 409, 'DUPLICATE_RESOURCE', error.keyValue);
  if (error?.name === 'CastError') return new AppError('Identificador o parámetro inválido', 400, 'INVALID_PARAMETER');
  return new AppError(error?.message || 'Error interno del servicio', error?.statusCode || 500, error?.code || 'INTERNAL_SERVICE_ERROR', error?.details);
}

function slugify(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

module.exports = { AppError, normalizeAppError, slugify };
