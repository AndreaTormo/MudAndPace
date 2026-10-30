const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { AppError } = require('./appError');

const ISSUER = process.env.JWT_ISSUER || 'trail-running-api';
const AUDIENCE = process.env.JWT_AUDIENCE || 'trail-running-frontend';

function normalizeRole(role) {
  return role === 'ADMIN' ? 'ADMIN' : 'USER';
}

function secret() {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET no está configurada', 500, 'AUTH_CONFIG_ERROR');
  }
  return process.env.JWT_SECRET;
}

function signAccessToken(user) {
  const jti = crypto.randomUUID();

  const token = jwt.sign(
    { role: normalizeRole(user.role), ver: Number(user.tokenVersion) || 0, jti },
    secret(),
    {
      subject: String(user._id),
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithm: 'HS256'
    }
  );

  const decoded = jwt.decode(token);
  return {
    token,
    jti,
    expiresAt: new Date(decoded.exp * 1000).toISOString()
  };
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, secret(), {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

module.exports = { signAccessToken, verifyAccessToken, hashToken, normalizeRole };
