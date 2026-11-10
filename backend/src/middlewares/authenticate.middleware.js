const mongoose = require('mongoose');
const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const { AppError } = require('../utils/appError');
const { ACCESS_COOKIE_NAME, clearAccessCookieOptions } = require('../utils/authCookie');
const { verifyAccessToken, normalizeRole } = require('../utils/jwt');

async function authenticate(req, res, next) {
  try {
    const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME];
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    const token = typeof cookieToken === 'string' && cookieToken.trim()
      ? cookieToken.trim()
      : (match ? match[1].trim() : null);

    if (!token) {
      throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
    }

    const payload = verifyAccessToken(token);

    if (!payload.sub || !mongoose.isValidObjectId(payload.sub) || !payload.jti) {
      throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
    }

    const session = await sessionRepository.findActiveByJti(payload.jti);
    if (!session || String(session.userId) !== String(payload.sub)) {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive || user.deleted_at || user.status === 'blocked') {
      throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
    }

    if (Number(payload.ver ?? 0) !== Number(user.tokenVersion ?? 0)) {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }

    const role = normalizeRole(user.role);

    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role,
      roleName: role,
      isActive: user.isActive,
      status: user.status,
      tokenVersion: user.tokenVersion
    };
    req.auth = {
      jti: payload.jti,
      token,
      source: typeof cookieToken === 'string' && cookieToken.trim() ? 'cookie' : 'bearer'
    };

    next();
  } catch (error) {
    if (req.cookies?.[ACCESS_COOKIE_NAME]) {
      res.clearCookie(ACCESS_COOKIE_NAME, clearAccessCookieOptions());
    }
    next(error);
  }
}

module.exports = authenticate;
