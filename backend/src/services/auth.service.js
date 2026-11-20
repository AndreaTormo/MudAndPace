const crypto = require('crypto');
const mongoose = require('mongoose');
const userRepository = require('../repositories/user.repository');
const profileRepository = require('../repositories/profile.repository');
const sessionRepository = require('../repositories/session.repository');
const { AppError, normalizeAppError } = require('../utils/appError');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  normalizeRole
} = require('../utils/jwt');
const { toPublicUser } = require('../utils/publicUser');
const { validateService } = require('../utils/validation');
const { comparePassword } = require('../utils/passwrd');
const { loginSchema } = require('../validators/auth.validator');
const { roleValues } = require('../validators/user.validator');

class AuthService {
  async authenticateCredentials(data) {
    const input = validateService(loginSchema, data);
    const user = await userRepository.findByEmail(input.email, { withPassword: true });

    if (!user || !user.passwordHash || !(await comparePassword(input.password, user.passwordHash))) {
      throw new AppError('Email o contraseña incorrectos', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive || user.deleted_at || user.status === 'blocked') {
      throw new AppError('La cuenta está desactivada', 403, 'ACCOUNT_DISABLED');
    }

    if (!roleValues.includes(user.role)) {
      throw new AppError('El rol del usuario no es válido', 403, 'INVALID_ROLE');
    }

    const profile = await profileRepository.findByUserId(user._id);
    return { user, profile };
  }

  async login(data, meta = {}) {
    try {
      const { user, profile } = await this.authenticateCredentials(data);
      const session = signAccessToken(user);

      await sessionRepository.create({
        userId: user._id,
        jti: session.jti,
        tokenHash: hashToken(session.token),
        expiresAt: new Date(session.expiresAt),
        ip: meta.ip || null,
        userAgent: meta.userAgent || null
      });

      return {
        token: session.token,
        expiresAt: session.expiresAt,
        user: toPublicUser(user, profile)
      };
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async loginUser(data, meta = {}) {
    try {
      const { user, profile } = await this.authenticateCredentials(data);

      if (normalizeRole(user.role) !== 'USER') {
        throw new AppError('Este acceso es solo para usuarios', 403, 'INVALID_ROLE');
      }

      const familyId = crypto.randomUUID();
      const access = signAccessToken(user);
      const refresh = signRefreshToken(user);

      await Promise.all([
        sessionRepository.create({
          userId: user._id,
          jti: access.jti,
          tokenHash: hashToken(access.token),
          expiresAt: new Date(access.expiresAt),
          ip: meta.ip || null,
          userAgent: meta.userAgent || null,
          kind: 'access',
          familyId
        }),
        sessionRepository.create({
          userId: user._id,
          jti: refresh.jti,
          tokenHash: hashToken(refresh.token),
          expiresAt: new Date(refresh.expiresAt),
          ip: meta.ip || null,
          userAgent: meta.userAgent || null,
          kind: 'refresh',
          familyId
        })
      ]);

      return {
        accessToken: access.token,
        refreshToken: refresh.token,
        expiresAt: access.expiresAt,
        refreshExpiresAt: refresh.expiresAt,
        user: toPublicUser(user, profile)
      };
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async refresh(refreshToken, meta = {}) {
    try {
      if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
        throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }

      const payload = verifyRefreshToken(refreshToken.trim());

      if (!payload.sub || !mongoose.isValidObjectId(payload.sub) || !payload.jti) {
        throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }

      const session = await sessionRepository.findActiveRefreshByJti(payload.jti);
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

      await sessionRepository.revokeByFamily(session.familyId);

      const familyId = crypto.randomUUID();
      const access = signAccessToken(user);
      const refresh = signRefreshToken(user);

      await Promise.all([
        sessionRepository.create({
          userId: user._id,
          jti: access.jti,
          tokenHash: hashToken(access.token),
          expiresAt: new Date(access.expiresAt),
          ip: meta.ip || null,
          userAgent: meta.userAgent || null,
          kind: 'access',
          familyId
        }),
        sessionRepository.create({
          userId: user._id,
          jti: refresh.jti,
          tokenHash: hashToken(refresh.token),
          expiresAt: new Date(refresh.expiresAt),
          ip: meta.ip || null,
          userAgent: meta.userAgent || null,
          kind: 'refresh',
          familyId
        })
      ]);

      const profile = await profileRepository.findByUserId(user._id);

      return {
        accessToken: access.token,
        refreshToken: refresh.token,
        expiresAt: access.expiresAt,
        refreshExpiresAt: refresh.expiresAt,
        user: toPublicUser(user, profile)
      };
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async logout(jti, familyId) {
    try {
      if (!jti) {
        throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }

      await sessionRepository.revokeByJti(jti);
      await sessionRepository.revokeByFamily(familyId);

      return { message: 'Sesión cerrada correctamente' };
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async me(userId) {
    try {
      const user = await userRepository.findById(userId);

      if (!user) {
        throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }

      const profile = await profileRepository.findByUserId(user._id);

      return toPublicUser(user, profile);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }
}

module.exports = new AuthService();
