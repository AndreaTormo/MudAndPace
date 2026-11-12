const path = require('path');
const { createRequire } = require('module');

const backendRequire = createRequire(path.resolve(__dirname, '../../backend/package.json'));
const express = backendRequire('express');
const { rateLimit } = backendRequire('express-rate-limit');

const controller = require('../agent_ia_controller/agent_ia_controller');
const validate = require('../../backend/src/middlewares/validate.middleware');
const { chatSchema } = require('../agent_ia_validators/agent_ia.validator');

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    return res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Demasiadas solicitudes al asistente. Inténtalo de nuevo más tarde.'
      }
    });
  }
});

router.post('/chat', chatLimiter, validate(chatSchema), controller.chat);

module.exports = router;
