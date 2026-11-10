const service = require('../services/auth.service');
const {
  ACCESS_COOKIE_NAME,
  accessCookieOptions,
  clearAccessCookieOptions
} = require('../utils/authCookie');

class AuthController {
  async login(req, res, next) {
    try {
      const session = await service.login(req.body, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

      res.cookie(ACCESS_COOKIE_NAME, session.token, accessCookieOptions(session.expiresAt));

      return res.status(200).json({
        success: true,
        message: 'Sesión iniciada correctamente',
        data: session
      });
    } catch (error) {
      return next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const result = await service.logout(req.auth?.jti);
      res.clearCookie(ACCESS_COOKIE_NAME, clearAccessCookieOptions());

      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.clearCookie(ACCESS_COOKIE_NAME, clearAccessCookieOptions());
      return next(error);
    }
  }

  async me(req, res, next) {
    try {
      const user = await service.me(req.user.id);

      return res.status(200).json({
        success: true,
        message: 'Usuario autenticado obtenido correctamente',
        data: user
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AuthController();
