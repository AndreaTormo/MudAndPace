const service = require('../services/auth.service');
const {
  ACCESS_COOKIE_NAME,
  USER_ACCESS_COOKIE_NAME,
  USER_REFRESH_COOKIE_NAME,
  accessCookieOptions,
  clearAccessCookieOptions,
  clearUserCookieOptions,
  clearLegacyCookies,
  userAccessCookieOptions,
  userRefreshCookieOptions
} = require('../utils/authCookie');

class AuthController {
  async login(req, res, next) {
    try {
      const session = await service.login(req.body, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

      res.cookie(ACCESS_COOKIE_NAME, session.token, accessCookieOptions(session.expiresAt));
      clearLegacyCookies(res);

      return res.status(200).json({
        success: true,
        message: 'Sesión iniciada correctamente',
        data: session
      });
    } catch (error) {
      return next(error);
    }
  }

  async userLogin(req, res, next) {
    try {
      const session = await service.loginUser(req.body, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

      res.cookie(USER_ACCESS_COOKIE_NAME, session.accessToken, userAccessCookieOptions(session.expiresAt));
      res.cookie(USER_REFRESH_COOKIE_NAME, session.refreshToken, userRefreshCookieOptions(session.refreshExpiresAt));
      clearLegacyCookies(res);

      return res.status(200).json({
        success: true,
        message: 'Sesión iniciada correctamente',
        data: {
          expiresAt: session.expiresAt,
          refreshExpiresAt: session.refreshExpiresAt,
          user: session.user
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const session = await service.refresh(req.cookies?.[USER_REFRESH_COOKIE_NAME], {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

      res.cookie(USER_ACCESS_COOKIE_NAME, session.accessToken, userAccessCookieOptions(session.expiresAt));
      res.cookie(USER_REFRESH_COOKIE_NAME, session.refreshToken, userRefreshCookieOptions(session.refreshExpiresAt));
      clearLegacyCookies(res);

      return res.status(200).json({
        success: true,
        message: 'Sesión renovada correctamente',
        data: {
          expiresAt: session.expiresAt,
          refreshExpiresAt: session.refreshExpiresAt,
          user: session.user
        }
      });
    } catch (error) {
      res.clearCookie(USER_ACCESS_COOKIE_NAME, clearUserCookieOptions());
      res.clearCookie(USER_REFRESH_COOKIE_NAME, clearUserCookieOptions());
      clearLegacyCookies(res);
      return next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const result = await service.logout(req.auth?.jti, req.auth?.familyId);
      res.clearCookie(ACCESS_COOKIE_NAME, clearAccessCookieOptions());
      res.clearCookie(USER_ACCESS_COOKIE_NAME, clearUserCookieOptions());
      res.clearCookie(USER_REFRESH_COOKIE_NAME, clearUserCookieOptions());
      clearLegacyCookies(res);

      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.clearCookie(ACCESS_COOKIE_NAME, clearAccessCookieOptions());
      res.clearCookie(USER_ACCESS_COOKIE_NAME, clearUserCookieOptions());
      res.clearCookie(USER_REFRESH_COOKIE_NAME, clearUserCookieOptions());
      clearLegacyCookies(res);
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
