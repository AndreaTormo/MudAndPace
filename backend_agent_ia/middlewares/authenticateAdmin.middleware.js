const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/auth.repository');
const { AppError } = require('../utils/appError');

const ISSUER = process.env.JWT_ISSUER || 'trail-running-api';
const AUDIENCE = process.env.JWT_AUDIENCE || 'trail-running-frontend';
const ADMIN_COOKIE = process.env.AUTH_COOKIE_NAME || 'mp_access_token';

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, entry) => {
    const separator = entry.indexOf('=');
    if (separator === -1) return cookies;
    const name = entry.slice(0, separator).trim();
    const value = entry.slice(separator + 1).trim();
    if (name) cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function verifyAccessToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET no está configurada', 500, 'AUTH_CONFIG_ERROR');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE
    });

    if ((payload.type || 'access') !== 'access' || !payload.sub || !payload.jti) {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
    return payload;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
}

async function authenticateAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const bearer = header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    const cookieToken = parseCookies(req.headers.cookie)[ADMIN_COOKIE];
    const token = bearer || cookieToken;

    if (!token) {
      throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
    }

    const payload = verifyAccessToken(token);
    const session = await authRepository.findActiveSessionByJti(payload.jti);

    if (!session || String(session.userId) !== String(payload.sub)) {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }

    const user = await authRepository.findUserById(payload.sub);
    if (!user || user.role !== 'ADMIN' || !user.isActive || user.deleted_at || user.status === 'blocked') {
      throw new AppError('You do not have permission to access this resource', 403, 'FORBIDDEN');
    }

    if (Number(payload.ver ?? 0) !== Number(user.tokenVersion ?? 0)) {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }

    req.user = { id: String(user._id), role: 'ADMIN' };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authenticateAdmin;
