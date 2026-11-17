const express = require('express');
const { rateLimit } = require('express-rate-limit');

const controller = require('../controllers/weather.controller');
const validate = require('../middlewares/validate.middleware');
const { weatherQuerySchema } = require('../validators/weather.validator');

const router = express.Router();

const weatherLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    return res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Demasiadas consultas al clima. Inténtalo de nuevo más tarde.'
      }
    });
  }
});

router.get('/', weatherLimiter, validate(weatherQuerySchema, 'query'), controller.getWeather);

module.exports = router;
