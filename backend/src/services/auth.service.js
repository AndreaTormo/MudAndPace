const userRepository = require('../repositories/user.repository');
const profileRepository = require('../repositories/profile.repository');
const sessionRepository = require('../repositories/session.repository');
const { AppError, normalizeAppError } = require('../utils/appError');
const { signAccessToken, hashToken } = require('../utils/jwt');
const { toPublicUser } = require('../utils/publicUser');
const { validateService } = require('../utils/validation');
const { comparePassword } = require('../utils/passwrd');
const { loginSchema } = require('../validators/auth.validator');
const { roleValues } = require('../validators/user.validator');

class AuthService {
  async login(data, meta = {}) {
    try {
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

      const session = signAccessToken(user);

      await sessionRepository.create({
        userId: user._id,
        jti: session.jti,
        tokenHash: hashToken(session.token),
        expiresAt: new Date(session.expiresAt),
        ip: meta.ip || null,
        userAgent: meta.userAgent || null
      });

      const profile = await profileRepository.findByUserId(user._id);

      return {
        token: session.token,
        expiresAt: session.expiresAt,
        user: toPublicUser(user, profile)
      };
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async logout(jti) {
    try {
      if (!jti) {
        throw new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }

      await sessionRepository.revokeByJti(jti);

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
