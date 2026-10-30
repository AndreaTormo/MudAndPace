const { AppError } = require('../utils/appError');

function authorize(paramKey = null) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (paramKey && String(req.user.id) === String(req.params[paramKey])) {
      return next();
    }

    return next(new AppError('You do not have permission to access this resource', 403, 'FORBIDDEN'));
  };
}

module.exports = authorize;
