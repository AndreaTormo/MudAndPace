const { AppError } = require('../utils/appError');

function validate(schema, target = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
      return next(new AppError('Datos de entrada inválidos', 400, 'VALIDATION_ERROR', details));
    }
    req[target] = result.data;
    next();
  };
}

module.exports = validate;
