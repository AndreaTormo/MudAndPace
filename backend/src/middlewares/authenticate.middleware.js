const mongoose = require('mongoose');
const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const { AppError } = require('../utils/appError');
const {
  ACCESS_COOKIE_NAME,
  USER_ACCESS_COOKIE_NAME,
  USER_REFRESH_COOKIE_NAME,
  clearAccessCookieOptions,
  clearUserCookieOptions
} = require('../utils/authCookie');
const { verifyAccessToken, normalizeRole } = require('../utils/jwt');

function cookieValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function authenticate(req, res, next) {
  const cookies = req.cookies || {};
  const userAccessCookie = cookieValue(cookies[USER_ACCESS_COOKIE_NAME]);
  const adminAccessCookie = cookieValue(cookies[ACCESS_COOKIE_NAME]);
  const hasUserSession = Boolean(
    userAccessCookie || cookieValue(cookies[USER_REFRESH_COOKIE_NAME])
  );
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);

  try {
    let token;
    let source;

    if (userAccessCookie) {
      token = userAccessCookie;
      source = 'cookie';
    } else if (hasUserSession) {
      throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
    } else if (adminAccessCookie) {
      token = adminAccessCookie;
      source = 'cookie';
    } else if (match) {
      token = match[1].trim();
      source = 'bearer';
    }

    if (!token) {
      throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
    }

    const payload = verifyAccessToken(token);

    if (!payload.sub || !mongoose.isValidObjectId(payload.sub) || !payload.jti) {
      throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
    }

    const session = await sessionRepository.findActiveByJti(payload.jti, 'access');
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
      source,
      familyId: session.familyId || null
    };

    next();
  } catch (error) {
    if (hasUserSession) {
      res.clearCookie(USER_ACCESS_COOKIE_NAME, clearUserCookieOptions());
    } else if (adminAccessCookie) {
      res.clearCookie(ACCESS_COOKIE_NAME, clearAccessCookieOptions());
    }
    next(error);
  }
}

module.exports = authenticate;
