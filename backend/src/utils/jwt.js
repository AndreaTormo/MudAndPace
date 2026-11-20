const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { AppError } = require('./appError');

const ISSUER = process.env.JWT_ISSUER || 'trail-running-api';
const AUDIENCE = process.env.JWT_AUDIENCE || 'trail-running-frontend';
const REFRESH_TOKEN_TTL = '7d';

function normalizeRole(role) {
  return role === 'ADMIN' ? 'ADMIN' : 'USER';
}

function secret() {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET no está configurada', 500, 'AUTH_CONFIG_ERROR');
  }
  return process.env.JWT_SECRET;
}

function signToken(user, type, expiresIn) {
  const jti = crypto.randomUUID();

  const token = jwt.sign(
    { type, ver: Number(user.tokenVersion) || 0, jti },
    secret(),
    {
      subject: String(user._id),
      expiresIn,
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithm: 'HS256'
    }
  );

  const decoded = jwt.decode(token);
  return {
    token,
    jti,
    type,
    expiresAt: new Date(decoded.exp * 1000).toISOString()
  };
}

function signAccessToken(user) {
  return signToken(user, 'access', process.env.JWT_EXPIRES_IN || '1h');
}

function signRefreshToken(user) {
  return signToken(user, 'refresh', REFRESH_TOKEN_TTL);
}

function verifyToken(token, type) {
  try {
    const payload = jwt.verify(token, secret(), {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE
    });

    const expectedType = type || 'access';
    if ((payload.type || 'access') !== expectedType) {
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }

    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    }
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
}

function verifyAccessToken(token) {
  return verifyToken(token, 'access');
}

function verifyRefreshToken(token) {
  return verifyToken(token, 'refresh');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  normalizeRole
};
