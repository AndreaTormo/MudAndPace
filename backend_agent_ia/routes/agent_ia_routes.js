const express = require('express');
const { rateLimit } = require('express-rate-limit');

const controller = require('../controllers/agent_ia_controller');
const validate = require('../middlewares/validate.middleware');
const { chatSchema } = require('../validators/agent_ia.validator');
const weatherRoutes = require('./weather.routes');
const activityRoutes = require('./activity.routes');

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
router.use('/weather', weatherRoutes);
router.use('/activities', activityRoutes);

module.exports = router;
