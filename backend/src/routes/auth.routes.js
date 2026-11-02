const express = require('express');
const { rateLimit } = require('express-rate-limit');
const controller = require('../controllers/auth.controller');
const authenticate = require('../middlewares/authenticate.middleware');
const validate = require('../middlewares/validate.middleware');
const { loginSchema } = require('../validators/auth.validator');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    return res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.'
      }
    });
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    return res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Demasiados intentos de inicio de sesión. Inténtalo de nuevo más tarde.'
      }
    });
  }
});

router.post('/login', loginLimiter, validate(loginSchema), controller.login);
router.post('/logout', authLimiter, authenticate, controller.logout);
router.get('/me', authLimiter, authenticate, controller.me);

module.exports = router;
