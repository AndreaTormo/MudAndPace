const service = require('../services/auth.service');

class AuthController {
  async login(req, res, next) {
    try {
      const session = await service.login(req.body, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

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

      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AuthController();
