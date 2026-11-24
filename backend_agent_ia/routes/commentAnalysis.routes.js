const express = require('express');
const { rateLimit } = require('express-rate-limit');
const controller = require('../controllers/commentAnalysis.controller');
const validate = require('../middlewares/validate.middleware');
const authenticateAdmin = require('../middlewares/authenticateAdmin.middleware');
const { summaryParamsSchema, sentimentQuerySchema } = require('../validators/commentAnalysis.validator');

const router = express.Router();

function tooManyRequests(req, res) {
  return res.status(429).json({
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas solicitudes al análisis de comentarios. Inténtalo de nuevo más tarde.'
    }
  });
}

const summaryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => `${req.ip ?? 'unknown'}:${req.params.departureId ?? 'unknown'}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequests
});

const sentimentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => req.user?.id ?? req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequests
});

router.get(
  '/sentiment',
  authenticateAdmin,
  sentimentLimiter,
  validate(sentimentQuerySchema, 'query'),
  controller.getSentiment
);
router.get(
  '/:departureId/summary',
  summaryLimiter,
  validate(summaryParamsSchema, 'params'),
  controller.getSummary
);

module.exports = router;
